from typing import Dict, List

class ExplanationAgent:
    """Generate human-readable explanations from all agent outputs"""
    
    async def generate_explanation(
        self,
        risk_scores: Dict,
        trends: Dict,
        shap_features: Dict,
        guidelines: List[Dict],
        vitals: List[dict]
    ) -> Dict:
        """
        Synthesize all information into a coherent explanation
        """
        if not vitals:
            return self._default_explanation()
        
        latest_vitals = vitals[-1]
        primary_risk = shap_features.get("primary_risk", "sepsis")
        risk_data = risk_scores.get(primary_risk, {})
        
        # Build evidence summary
        evidence_summary = self._build_evidence_summary(latest_vitals, risk_data)
        
        # Build explanation text
        explanation_text = self._build_explanation_text(
            primary_risk,
            risk_data,
            shap_features,
            trends,
            evidence_summary
        )
        
        # Identify uncertainty flags
        uncertainty_flags = self._identify_uncertainties(vitals, risk_scores, trends)
        
        return {
            "risk_type": primary_risk,
            "risk_level": risk_data.get("level", "LOW"),
            "risk_probability": risk_data.get("probability", 0.0),
            "explanation_text": explanation_text,
            "evidence_summary": evidence_summary,
            "top_drivers": shap_features.get("top_drivers", []),
            "guideline_citations": guidelines,
            "uncertainty_flags": uncertainty_flags,
            "trends_summary": self._summarize_trends(trends)
        }
    
    def _build_evidence_summary(self, vitals: dict, risk_data: Dict) -> List[Dict]:
        """Build structured evidence summary"""
        evidence = []
        
        hr = vitals.get("heart_rate")
        if hr and hr > 100:
            evidence.append({
                "parameter": "Heart Rate",
                "value": f"{hr:.0f} bpm",
                "status": "elevated",
                "timestamp": vitals.get("timestamp", "N/A")
            })
        
        rr = vitals.get("respiratory_rate")
        if rr and rr > 22:
            evidence.append({
                "parameter": "Respiratory Rate",
                "value": f"{rr:.0f} /min",
                "status": "elevated",
                "timestamp": vitals.get("timestamp", "N/A")
            })
        
        map_val = vitals.get("mean_arterial_pressure")
        if map_val and map_val < 70:
            evidence.append({
                "parameter": "Mean Arterial Pressure",
                "value": f"{map_val:.0f} mmHg",
                "status": "low",
                "timestamp": vitals.get("timestamp", "N/A")
            })
        
        spo2 = vitals.get("spo2")
        if spo2 and spo2 < 94:
            evidence.append({
                "parameter": "SpO2",
                "value": f"{spo2:.1f}%",
                "status": "low",
                "timestamp": vitals.get("timestamp", "N/A")
            })
        
        temp = vitals.get("temperature")
        if temp and (temp > 38 or temp < 36):
            evidence.append({
                "parameter": "Temperature",
                "value": f"{temp:.1f}°C",
                "status": "abnormal",
                "timestamp": vitals.get("timestamp", "N/A")
            })
        
        return evidence
    
    def _build_explanation_text(
        self,
        risk_type: str,
        risk_data: Dict,
        shap_features: Dict,
        trends: Dict,
        evidence: List[Dict]
    ) -> str:
        """Build natural language explanation"""
        level = risk_data.get("level", "LOW")
        prob = risk_data.get("probability", 0.0) * 100
        
        explanation = f"Patient shows {level} risk ({prob:.0f}% probability) for {risk_type.replace('_', ' ').title()}.\n\n"
        
        if evidence:
            explanation += "Key findings:\n"
            for item in evidence[:3]:
                explanation += f"- {item['parameter']}: {item['value']} ({item['status']})\n"
        
        top_driver = shap_features.get("top_drivers", [{}])[0] if shap_features.get("top_drivers") else {}
        if top_driver:
            explanation += f"\nPrimary contributing factor: {top_driver.get('name', 'N/A')} "
            explanation += f"({top_driver.get('direction', 'N/A')} trend).\n"
        
        return explanation
    
    def _identify_uncertainties(
        self,
        vitals: List[dict],
        risk_scores: Dict,
        trends: Dict
    ) -> List[str]:
        """Identify data gaps and uncertainties"""
        uncertainties = []
        
        if len(vitals) < 5:
            uncertainties.append("Limited historical data (< 5 readings)")
        
        latest = vitals[-1] if vitals else {}
        missing_fields = []
        required = ["heart_rate", "respiratory_rate", "spo2", "temperature", "mean_arterial_pressure"]
        for field in required:
            if latest.get(field) is None:
                missing_fields.append(field)
        
        if missing_fields:
            uncertainties.append(f"Missing vital signs: {', '.join(missing_fields)}")
        
        # Check for conflicting signals
        risk_entries = [r for r in risk_scores.values() if isinstance(r, dict)]
        if risk_entries:
            max_risk = max([r.get("probability", 0) for r in risk_entries])
            if max_risk > 0.5:
                min_risk = min([r.get("probability", 0) for r in risk_entries])
                if max_risk - min_risk < 0.2:
                    uncertainties.append("Multiple risk conditions showing similar probabilities")
        
        return uncertainties
    
    def _summarize_trends(self, trends: Dict) -> Dict:
        """Summarize trend information"""
        return {
            "heart_rate_trend": "increasing" if trends.get("hr_slope", 0) > 0.5 else "decreasing" if trends.get("hr_slope", 0) < -0.5 else "stable",
            "blood_pressure_trend": "decreasing" if trends.get("map_slope", 0) < -0.5 else "stable",
            "respiratory_trend": "increasing" if trends.get("rr_slope", 0) > 0.5 else "stable"
        }
    
    def _default_explanation(self) -> Dict:
        """Return default explanation"""
        return {
            "risk_type": "unknown",
            "risk_level": "LOW",
            "risk_probability": 0.0,
            "explanation_text": "Insufficient data for risk assessment",
            "evidence_summary": [],
            "top_drivers": [],
            "guideline_citations": [],
            "uncertainty_flags": ["Insufficient data"],
            "trends_summary": {}
        }
