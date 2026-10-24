from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from datetime import datetime, timedelta
import asyncio
from app.agents.baseline_agent import BaselineAgent
from app.agents.trend_agent import TrendAgent
from app.agents.risk_predictor import RiskPredictor
from app.agents.shap_explainer import SHAPExplainer
from app.agents.rag_retriever import RAGRetriever
from app.agents.explanation_agent import ExplanationAgent
from app.agents.safety_layer import SafetyLayer
from app.services.audit_logger import AuditLogger
from app.database import get_active_encounters, get_recent_vitals, save_alert, get_latest_alert
from app.config import settings

class AgentState(TypedDict):
    encounter_id: int
    patient_id: int
    vitals: list
    labs: dict
    notes: list
    baseline: dict
    trends: dict
    risk_scores: dict
    shap_features: dict
    guidelines: list
    explanation: dict
    safety_check: dict
    should_alert: bool

class RiskMonitoringOrchestrator:
    def __init__(self):
        self.baseline_agent = BaselineAgent()
        self.trend_agent = TrendAgent()
        self.risk_predictor = RiskPredictor()
        # Pass trained models to SHAP explainer so it uses real TreeExplainer
        self.shap_explainer = SHAPExplainer(trained_models=self.risk_predictor.models)
        self.rag_retriever = RAGRetriever()
        self.explanation_agent = ExplanationAgent()
        self.safety_layer = SafetyLayer()
        self.audit_logger = AuditLogger()
        self.graph = self._build_graph()
        
    def _build_graph(self) -> StateGraph:
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("baseline", self.baseline_node)
        workflow.add_node("trends", self.trend_node)
        workflow.add_node("risk_prediction", self.risk_prediction_node)
        workflow.add_node("shap_explain", self.shap_node)
        workflow.add_node("rag_retrieve", self.rag_node)
        workflow.add_node("explain", self.explanation_node)
        workflow.add_node("safety_check", self.safety_node)
        
        # Add edges
        workflow.set_entry_point("baseline")
        workflow.add_edge("baseline", "trends")
        workflow.add_edge("trends", "risk_prediction")
        workflow.add_edge("risk_prediction", "shap_explain")
        workflow.add_edge("shap_explain", "rag_retrieve")
        workflow.add_edge("rag_retrieve", "explain")
        workflow.add_edge("explain", "safety_check")
        workflow.add_conditional_edges(
            "safety_check",
            lambda x: "alert" if x.get("should_alert", False) else "end",
            {"alert": END, "end": END}
        )
        
        return workflow.compile()
    
    async def baseline_node(self, state: AgentState) -> AgentState:
        baseline = await self.baseline_agent.compute_baseline(state["vitals"])
        state["baseline"] = baseline
        try:
            await self.audit_logger.log(
                "baseline_computed", state["encounter_id"],
                data={"vitals_count": len(state["vitals"])},
                output_data={"baseline": baseline})
        except RuntimeError:
            pass  # Audit failure should not stop clinical monitoring
        return state
    
    async def trend_node(self, state: AgentState) -> AgentState:
        trends = await self.trend_agent.detect_trends(
            state["vitals"],
            state["baseline"]
        )
        state["trends"] = trends
        try:
            await self.audit_logger.log(
                "trends_detected", state["encounter_id"],
                data={"vitals_count": len(state["vitals"])},
                output_data={"news2_score": trends.get("news2_score"), "qsofa": trends.get("qsofa_score")})
        except RuntimeError:
            pass
        return state
    
    async def risk_prediction_node(self, state: AgentState) -> AgentState:
        risk_scores = await self.risk_predictor.predict_risk(
            state["vitals"],
            state["labs"],
            state["trends"]
        )
        state["risk_scores"] = risk_scores
        try:
            await self.audit_logger.log(
                "risk_predicted", state["encounter_id"],
                data={"vitals_count": len(state["vitals"])},
                output_data={"risk_scores": {
                    k: {"level": v.get("level"), "probability": v.get("probability")}
                    for k, v in risk_scores.items() if isinstance(v, dict)
                }})
        except RuntimeError:
            pass
        return state
    
    async def shap_node(self, state: AgentState) -> AgentState:
        shap_features = await self.shap_explainer.explain(
            state["vitals"],
            state["risk_scores"]
        )
        state["shap_features"] = shap_features
        try:
            await self.audit_logger.log(
                "shap_explained", state["encounter_id"],
                data={"primary_risk": shap_features.get("primary_risk")},
                output_data={"top_drivers": shap_features.get("top_drivers", [])})
        except RuntimeError:
            pass
        return state
    
    async def rag_node(self, state: AgentState) -> AgentState:
        query_terms = self.shap_explainer.get_query_terms(state["shap_features"])
        guidelines = await self.rag_retriever.retrieve_guidelines(
            query_terms,
            state["risk_scores"]
        )
        state["guidelines"] = guidelines
        try:
            await self.audit_logger.log(
                "guidelines_retrieved", state["encounter_id"],
                data={"query_terms": query_terms},
                output_data={"guidelines_count": len(guidelines)})
        except RuntimeError:
            pass
        return state
    
    async def explanation_node(self, state: AgentState) -> AgentState:
        explanation = await self.explanation_agent.generate_explanation(
            state["risk_scores"],
            state["trends"],
            state["shap_features"],
            state["guidelines"],
            state["vitals"]
        )
        state["explanation"] = explanation
        try:
            await self.audit_logger.log(
                "explanation_generated", state["encounter_id"],
                data={"risk_level": explanation.get("risk_level")},
                output_data={"explanation": explanation})
        except RuntimeError:
            pass
        return state
    
    async def safety_node(self, state: AgentState) -> AgentState:
        safety_check = await self.safety_layer.validate(
            state["vitals"],
            state["risk_scores"],
            state["explanation"],
            encounter_id=state["encounter_id"]   # ← needed for cooldown
        )
        state["safety_check"] = safety_check
        state["should_alert"] = safety_check["should_alert"]
        try:
            await self.audit_logger.log(
                "safety_checked", state["encounter_id"],
                data={"max_risk": safety_check.get("max_risk_score")},
                output_data={"should_alert": safety_check["should_alert"],
                             "blocked": safety_check["blocked"],
                             "cooldown_suppressed": safety_check.get("cooldown_suppressed", False),
                             "warnings": safety_check["warnings"]})
        except RuntimeError:
            pass
        return state
    
    async def process_encounter(self, encounter_id: int, patient_id: int) -> dict:
        # Fetch recent data
        vitals = await get_recent_vitals(encounter_id, hours=24)
        
        initial_state = {
            "encounter_id": encounter_id,
            "patient_id": patient_id,
            "vitals": vitals,
            "labs": {},  # Fetch recent labs
            "notes": [],  # Fetch recent notes
        }
        
        result = await self.graph.ainvoke(initial_state)
        return result
    
    async def continuous_monitoring_loop(self, websocket_manager):
        """Background task for continuous patient monitoring"""
        print("[Orchestrator] monitoring loop started")
        while True:
            try:
                print(f"[Orchestrator] Checking monitoring at {datetime.utcnow()}")
                active_encounters = await get_active_encounters()
                print(f"[Orchestrator] Found {len(active_encounters)} active encounters")
                
                for encounter in active_encounters:
                    result = await self.process_encounter(
                        encounter.id,
                        encounter.patient_id
                    )
                    
                    if result.get("should_alert", False):
                        # Send WebSocket alert
                        alert_data = {
                            "encounter_id": encounter.id,
                            "risk_scores": result["risk_scores"],
                            "explanation": result["explanation"],
                            "timestamp": datetime.utcnow().isoformat()
                        }
                        await websocket_manager.broadcast(alert_data)
                    
                    # Persist to database for Dashboard visibility
                    # Logic: Only save if risk is >= MEDIUM, or if no alert exists yet
                    risk_scores = result.get("risk_scores", {})
                    max_risk_level = "LOW"
                    for r_type, r in risk_scores.items():
                        if isinstance(r, dict) and r.get("level") in ["MEDIUM", "HIGH", "CRITICAL"]:
                            max_risk_level = r["level"]
                            print(f"[Orchestrator] Elevated risk detected for Patient {encounter.patient_id}: {max_risk_level} ({r_type})")
                            break
                    
                    # Always save if not LOW, or if it's the first assessment
                    latest_db_alert = await get_latest_alert(encounter.id)
                    if max_risk_level != "LOW" or not latest_db_alert:
                        print(f"[Orchestrator] Saving alert to DB for Encounter {encounter.id} (Level: {max_risk_level})")
                        await save_alert(
                            encounter.id, 
                            result["risk_scores"], 
                            result.get("explanation"),
                            result.get("shap_features")
                        )
                
                await asyncio.sleep(10)  # Check every 10 seconds for verification
                
            except Exception as e:
                print(f"Error in monitoring loop: {e}")
                import traceback
                traceback.print_exc()
                await asyncio.sleep(10)
