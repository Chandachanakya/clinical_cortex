"""
report_generator.py — Clinical PDF report generator.

PDF engine strategy (cross-platform):
  1. ReportLab (primary, pure-Python, always works on Windows)
  2. WeasyPrint (secondary, only if GTK+/Cairo are installed)

WeasyPrint is still imported silently so it can be used on Linux/Mac
servers where the native libraries are present, but it is never
required — eliminating the startup warning on Windows.
"""

import os
import io
import warnings
from datetime import datetime
from typing import Dict, List

from jinja2 import Template

# ── WeasyPrint (optional, suppressed) ────────────────────────────────────────
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    try:
        from weasyprint import HTML as WeasyHTML
        WEASYPRINT_AVAILABLE = True
    except Exception:
        WEASYPRINT_AVAILABLE = False

# ── ReportLab (always available) ─────────────────────────────────────────────
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER


# ─────────────────────────────────────────────────────────────────────────────

class ReportGenerator:
    """Generate PDF clinical risk assessment reports."""

    def __init__(self):
        self.html_template = self._load_html_template()

    # ── HTML template (used by WeasyPrint path) ───────────────────────────────

    def _load_html_template(self) -> Template:
        html = """<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
  .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { color: #2563eb; margin: 0; }
  .section { margin-bottom: 30px; }
  .section h2 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
  .risk-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
  .risk-box.high { background: #fef3c7; border-color: #f59e0b; }
  .evidence-item { margin: 10px 0; padding: 10px; background: #f9fafb; }
  .guideline { border: 1px solid #d1d5db; padding: 15px; margin: 10px 0; background: #f0f9ff; }
  .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
  th { background: #f3f4f6; }
  .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb;
            font-size: 12px; color: #6b7280; }
</style></head>
<body>
  <div class="header">
    <h1>Clinical Cortex — Risk Assessment Report</h1>
    <p><strong>Generated:</strong> {{ generated_time }}</p>
    <p><strong>Patient:</strong> {{ patient_name }} (MRN: {{ patient_mrn }})</p>
  </div>
  <div class="section">
    <h2>Risk Summary</h2>
    <div class="risk-box {{ 'high' if risk_level in ['HIGH', 'CRITICAL'] else '' }}">
      <h3>{{ risk_type }} — {{ risk_level }} RISK</h3>
      <p><strong>Probability:</strong> {{ risk_probability }}%</p>
    </div>
  </div>
  <div class="section">
    <h2>Evidence Summary</h2>
    {% for e in evidence_list %}
    <div class="evidence-item">
      <strong>{{ e.parameter }}:</strong> {{ e.value }} ({{ e.timestamp }})
    </div>
    {% endfor %}
  </div>
  <div class="section">
    <h2>Top Contributing Factors (SHAP)</h2>
    <table>
      <tr><th>Factor</th><th>Impact</th></tr>
      {% for f in shap_factors %}
      <tr><td>{{ f.name }}</td><td>{{ f.impact }}</td></tr>
      {% endfor %}
    </table>
  </div>
  <div class="section">
    <h2>Guideline References</h2>
    {% for g in guidelines %}
    <div class="guideline">
      <h4>{{ g.title }}</h4>
      <p><strong>Source:</strong> {{ g.source }} (v{{ g.version }})</p>
      <p><strong>Section:</strong> {{ g.section }}</p>
      <p>{{ g.excerpt }}</p>
    </div>
    {% endfor %}
  </div>
  {% if uncertainty_flags %}
  <div class="section">
    <h2>Uncertainty Flags &amp; Data Gaps</h2>
    {% for flag in uncertainty_flags %}
    <div class="warning">⚠️ {{ flag }}</div>
    {% endfor %}
  </div>
  {% endif %}
  <div class="section">
    <div class="warning">
      <strong>⚠️ ADVISORY NOTICE:</strong> This system provides decision support only.
      Clinician review is required before any clinical intervention.
    </div>
  </div>
  <div class="footer">
    <p><strong>Report ID:</strong> {{ report_id }}</p>
    <p><strong>Model Version:</strong> {{ model_version }}</p>
    <p>This report contains confidential patient information protected by HIPAA.</p>
  </div>
</body>
</html>"""
        return Template(html)

    # ── Public API ────────────────────────────────────────────────────────────

    async def generate_report(
        self,
        alert_data: Dict,
        patient_data: Dict,
        output_path: str,
    ) -> str:
        """
        Generate a PDF report and write it to *output_path*.
        Uses ReportLab (always available) unless WeasyPrint is present.
        """
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

        risk_type_key = (
            alert_data.get("explanation", {})
            .get("risk_type", "sepsis")
            .lower()
            .replace(" ", "_")
        )
        risk_data = alert_data.get("risk_scores", {}).get(risk_type_key, {})

        ctx = {
            "generated_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "patient_name":   patient_data.get("name", "Unknown"),
            "patient_mrn":    patient_data.get("mrn", "N/A"),
            "risk_type":      alert_data.get("explanation", {}).get("risk_type", "Unknown"),
            "risk_level":     alert_data.get("explanation", {}).get("risk_level", "UNKNOWN"),
            "risk_probability": int(risk_data.get("probability", 0) * 100),
            "evidence_list":  alert_data.get("explanation", {}).get("evidence_summary", []),
            "shap_factors":   alert_data.get("explanation", {}).get("top_drivers", []),
            "guidelines":     alert_data.get("explanation", {}).get("guideline_citations", []),
            "uncertainty_flags": alert_data.get("explanation", {}).get("uncertainty_flags", []),
            "report_id":      f"RPT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "model_version":  "1.0.0",
        }

        if WEASYPRINT_AVAILABLE:
            html_content = self.html_template.render(**ctx)
            WeasyHTML(string=html_content).write_pdf(output_path)
        else:
            self._generate_reportlab(ctx, output_path)

        return output_path

    # ── ReportLab PDF builder ─────────────────────────────────────────────────

    def _generate_reportlab(self, ctx: Dict, output_path: str) -> None:
        """Build a clean PDF using ReportLab (pure-Python, no native deps)."""
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm,
        )
        styles = getSampleStyleSheet()
        BLUE   = colors.HexColor("#2563eb")
        YELLOW = colors.HexColor("#fef3c7")
        RED    = colors.HexColor("#fee2e2")

        h1 = ParagraphStyle("H1", parent=styles["Heading1"], textColor=BLUE, fontSize=18)
        h2 = ParagraphStyle("H2", parent=styles["Heading2"], textColor=colors.HexColor("#1f2937"), fontSize=13)
        body = styles["Normal"]
        small = ParagraphStyle("Small", parent=body, fontSize=9, textColor=colors.grey)

        story = []

        # ── Header ────────────────────────────────────────────────────────────
        story.append(Paragraph("Clinical Cortex — Risk Assessment Report", h1))
        story.append(HRFlowable(width="100%", thickness=2, color=BLUE))
        story.append(Spacer(1, 4 * mm))
        story.append(Paragraph(f"<b>Generated:</b> {ctx['generated_time']}", body))
        story.append(Paragraph(
            f"<b>Patient:</b> {ctx['patient_name']} &nbsp;|&nbsp; <b>MRN:</b> {ctx['patient_mrn']}",
            body,
        ))
        story.append(Spacer(1, 8 * mm))

        # ── Risk Summary ──────────────────────────────────────────────────────
        story.append(Paragraph("Risk Summary", h2))
        bg = RED if ctx["risk_level"] in ("HIGH", "CRITICAL") else YELLOW
        summary_table = Table(
            [[Paragraph(
                f"<b>{ctx['risk_type']} — {ctx['risk_level']} RISK</b><br/>"
                f"Probability: {ctx['risk_probability']}%",
                body,
            )]],
            colWidths=["100%"],
        )
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg),
            ("BOX",        (0, 0), (-1, -1), 1, colors.HexColor("#dc2626")),
            ("LEFTPADDING",  (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING",   (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 6 * mm))

        # ── Evidence ─────────────────────────────────────────────────────────
        story.append(Paragraph("Evidence Summary", h2))
        for ev in ctx.get("evidence_list", []):
            story.append(Paragraph(
                f"<b>{ev.get('parameter','—')}:</b> {ev.get('value','—')} "
                f"({ev.get('timestamp','—')})",
                body,
            ))
        story.append(Spacer(1, 6 * mm))

        # ── SHAP Factors ─────────────────────────────────────────────────────
        if ctx.get("shap_factors"):
            story.append(Paragraph("Top Contributing Factors (SHAP)", h2))
            shap_data = [["Factor", "Impact"]] + [
                [f.get("name", "—"), str(f.get("impact", "—"))]
                for f in ctx["shap_factors"]
            ]
            shap_table = Table(shap_data, colWidths=[90 * mm, 70 * mm])
            shap_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f3f4f6")),
                ("GRID",       (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
                ("PADDING",    (0, 0), (-1, -1), 6),
            ]))
            story.append(shap_table)
            story.append(Spacer(1, 6 * mm))

        # ── Guidelines ───────────────────────────────────────────────────────
        if ctx.get("guidelines"):
            story.append(Paragraph("Guideline References", h2))
            for g in ctx["guidelines"]:
                story.append(Paragraph(f"<b>{g.get('title','')}</b>", body))
                story.append(Paragraph(
                    f"Source: {g.get('source','')} (v{g.get('version','')}) — "
                    f"Section: {g.get('section','')}",
                    small,
                ))
                story.append(Paragraph(g.get("excerpt", ""), body))
                story.append(Spacer(1, 4 * mm))

        # ── Uncertainty flags ─────────────────────────────────────────────────
        if ctx.get("uncertainty_flags"):
            story.append(Paragraph("Uncertainty Flags & Data Gaps", h2))
            for flag in ctx["uncertainty_flags"]:
                story.append(Paragraph(f"⚠ {flag}", body))
            story.append(Spacer(1, 4 * mm))

        # ── Advisory notice ───────────────────────────────────────────────────
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb")))
        story.append(Spacer(1, 4 * mm))
        notice = Table(
            [[Paragraph(
                "<b>⚠ ADVISORY NOTICE:</b> This system provides decision support only. "
                "Clinician review is required before any clinical intervention. "
                "This system does not diagnose or prescribe treatment.",
                body,
            )]],
            colWidths=["100%"],
        )
        notice.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), YELLOW),
            ("BOX",        (0, 0), (-1, -1), 1, colors.HexColor("#f59e0b")),
            ("PADDING",    (0, 0), (-1, -1), 8),
        ]))
        story.append(notice)
        story.append(Spacer(1, 6 * mm))

        # ── Footer ────────────────────────────────────────────────────────────
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb")))
        story.append(Spacer(1, 3 * mm))
        story.append(Paragraph(f"Report ID: {ctx['report_id']}", small))
        story.append(Paragraph(f"Model Version: {ctx['model_version']}", small))
        story.append(Paragraph(
            "This report contains confidential patient information protected by HIPAA.",
            small,
        ))

        doc.build(story)
