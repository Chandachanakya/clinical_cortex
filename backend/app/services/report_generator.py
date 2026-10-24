try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except Exception:
    # On Windows, weasyprint may fail with OSError if GTK+ is missing
    WEASYPRINT_AVAILABLE = False
from datetime import datetime
from typing import Dict, List
import os
from jinja2 import Template

class ReportGenerator:
    """Generate PDF reports for clinical alerts"""
    
    def __init__(self):
        self.template = self._load_template()
    
    def _load_template(self) -> Template:
        """HTML template for PDF report"""
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 40px;
                    color: #333;
                }
                .header {
                    border-bottom: 3px solid #2563eb;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #2563eb;
                    margin: 0;
                }
                .section {
                    margin-bottom: 30px;
                }
                .section h2 {
                    color: #1f2937;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 10px;
                }
                .risk-box {
                    background: #fee2e2;
                    border-left: 4px solid #dc2626;
                    padding: 15px;
                    margin: 20px 0;
                }
                .risk-box.high {
                    background: #fef3c7;
                    border-color: #f59e0b;
                }
                .evidence-item {
                    margin: 10px 0;
                    padding: 10px;
                    background: #f9fafb;
                }
                .guideline {
                    border: 1px solid #d1d5db;
                    padding: 15px;
                    margin: 10px 0;
                    background: #f0f9ff;
                }
                .warning {
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 10px;
                    margin: 10px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th, td {
                    border: 1px solid #d1d5db;
                    padding: 10px;
                    text-align: left;
                }
                th {
                    background: #f3f4f6;
                }
                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 2px solid #e5e7eb;
                    font-size: 12px;
                    color: #6b7280;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Clinical Risk Assessment Report</h1>
                <p><strong>Generated:</strong> {{ generated_time }}</p>
                <p><strong>Patient:</strong> {{ patient_name }} (MRN: {{ patient_mrn }})</p>
            </div>
            
            <div class="section">
                <h2>Risk Summary</h2>
                <div class="risk-box {{ 'high' if risk_level in ['HIGH', 'CRITICAL'] else '' }}">
                    <h3>{{ risk_type }} - {{ risk_level }} RISK</h3>
                    <p><strong>Probability:</strong> {{ risk_probability }}%</p>
                </div>
            </div>
            
            <div class="section">
                <h2>Evidence Summary</h2>
                {% for evidence in evidence_list %}
                <div class="evidence-item">
                    <strong>{{ evidence.parameter }}:</strong> {{ evidence.value }} 
                    ({{ evidence.timestamp }})
                </div>
                {% endfor %}
            </div>
            
            <div class="section">
                <h2>Top Contributing Factors (SHAP Analysis)</h2>
                <table>
                    <tr>
                        <th>Factor</th>
                        <th>Impact</th>
                    </tr>
                    {% for factor in shap_factors %}
                    <tr>
                        <td>{{ factor.name }}</td>
                        <td>{{ factor.impact }}</td>
                    </tr>
                    {% endfor %}
                </table>
            </div>
            
            <div class="section">
                <h2>Guideline References</h2>
                {% for guideline in guidelines %}
                <div class="guideline">
                    <h4>{{ guideline.title }}</h4>
                    <p><strong>Source:</strong> {{ guideline.source }} (v{{ guideline.version }})</p>
                    <p><strong>Section:</strong> {{ guideline.section }}</p>
                    <p>{{ guideline.excerpt }}</p>
                </div>
                {% endfor %}
            </div>
            
            {% if uncertainty_flags %}
            <div class="section">
                <h2>Uncertainty Flags & Data Gaps</h2>
                {% for flag in uncertainty_flags %}
                <div class="warning">
                    ⚠️ {{ flag }}
                </div>
                {% endfor %}
            </div>
            {% endif %}
            
            <div class="section">
                <div class="warning">
                    <strong>⚠️ ADVISORY NOTICE:</strong> This system provides decision support only. 
                    Clinician review, confirmation, and independent assessment are required before 
                    any clinical intervention. This system does not diagnose or prescribe treatment.
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Report ID:</strong> {{ report_id }}</p>
                <p><strong>Model Version:</strong> {{ model_version }}</p>
                <p><strong>System:</strong> Clinical Risk Monitoring & Decision Support Agent v1.0</p>
                <p>This report contains confidential patient information protected by HIPAA.</p>
            </div>
        </body>
        </html>
        """
        return Template(html_template)
    
    async def generate_report(self, alert_data: Dict, patient_data: Dict, 
                             output_path: str) -> str:
        """Generate PDF report from alert data"""
        if not WEASYPRINT_AVAILABLE:
            raise RuntimeError(
                "PDF generation is currently unavailable because 'weasyprint' dependencies "
                "are not installed. Please contact system admin to install GTK+ and weasyprint."
            )
        
        # Prepare template data
        risk_type_key = alert_data["explanation"]["risk_type"].lower().replace(" ", "_")
        risk_data = alert_data["risk_scores"].get(risk_type_key, {})
        
        template_data = {
            "generated_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "patient_name": patient_data.get("name", "Unknown"),
            "patient_mrn": patient_data.get("mrn", "N/A"),
            "risk_type": alert_data["explanation"]["risk_type"],
            "risk_level": alert_data["explanation"]["risk_level"],
            "risk_probability": int(risk_data.get("probability", 0) * 100),
            "evidence_list": alert_data["explanation"].get("evidence_summary", []),
            "shap_factors": alert_data["explanation"].get("top_drivers", []),
            "guidelines": alert_data["explanation"].get("guideline_citations", []),
            "uncertainty_flags": alert_data["explanation"].get("uncertainty_flags", []),
            "report_id": f"RPT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "model_version": "1.0.0"
        }
        
        # Render HTML
        html_content = self.template.render(**template_data)
        
        # Generate PDF
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        HTML(string=html_content).write_pdf(output_path)
        
        return output_path
