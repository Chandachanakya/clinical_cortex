import fitz  # PyMuPDF
import pdfplumber
from typing import Dict, List
import re

class PDFParser:
    """Parse lab result PDFs"""
    
    def parse_lab_pdf(self, pdf_path: str) -> Dict:
        """
        Extract structured data from lab result PDF
        Returns: {lab_type: str, values: dict, timestamp: str}
        """
        try:
            # Try PyMuPDF first
            doc = fitz.open(pdf_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            
            # Extract lab values using regex
            lab_values = self._extract_lab_values(text)
            
            return {
                "lab_type": self._detect_lab_type(text),
                "values": lab_values,
                "timestamp": self._extract_timestamp(text),
                "raw_text": text[:500]  # First 500 chars
            }
        except Exception as e:
            print(f"Error parsing PDF with PyMuPDF: {e}")
            # Fallback to pdfplumber
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    text = ""
                    for page in pdf.pages:
                        text += page.extract_text() or ""
                
                lab_values = self._extract_lab_values(text)
                return {
                    "lab_type": self._detect_lab_type(text),
                    "values": lab_values,
                    "timestamp": self._extract_timestamp(text),
                    "raw_text": text[:500]
                }
            except Exception as e2:
                print(f"Error parsing PDF with pdfplumber: {e2}")
                return {"lab_type": "unknown", "values": {}, "timestamp": None}
    
    def _extract_lab_values(self, text: str) -> Dict:
        """Extract lab values from text"""
        values = {}
        
        # Common lab patterns
        patterns = {
            "creatinine": r"creatinine[:\s]+([\d.]+)",
            "lactate": r"lactate[:\s]+([\d.]+)",
            "hemoglobin": r"hemoglobin[:\s]+([\d.]+)",
            "white_blood_cell": r"wbc[:\s]+([\d.]+)",
            "sodium": r"sodium[:\s]+([\d.]+)",
            "potassium": r"potassium[:\s]+([\d.]+)",
            "glucose": r"glucose[:\s]+([\d.]+)"
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    values[key] = float(match.group(1))
                except:
                    pass
        
        return values
    
    def _detect_lab_type(self, text: str) -> str:
        """Detect lab type from text"""
        text_lower = text.lower()
        if "cbc" in text_lower or "complete blood count" in text_lower:
            return "CBC"
        elif "bmp" in text_lower or "basic metabolic panel" in text_lower:
            return "BMP"
        elif "cmp" in text_lower or "comprehensive metabolic panel" in text_lower:
            return "CMP"
        elif "lactate" in text_lower:
            return "Lactate"
        else:
            return "Unknown"
    
    def _extract_timestamp(self, text: str) -> str:
        """Extract timestamp from PDF text"""
        # Look for date patterns
        date_patterns = [
            r"(\d{1,2}/\d{1,2}/\d{4})",
            r"(\d{4}-\d{2}-\d{2})",
            r"(\d{1,2}-\d{1,2}-\d{4})"
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        
        return None
