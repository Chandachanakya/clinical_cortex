from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from app.routers import auth, patients, vitals, alerts, reports, admin, demo
from app.websocket import ConnectionManager
from app.database import init_db
from app.agents.orchestrator import RiskMonitoringOrchestrator

manager = ConnectionManager()
orchestrator = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global orchestrator
    print("[Main] Entering lifespan startup...")
    try:
        print("[Main] Initializing database...")
        await init_db()
        print("[Main] ✓ Database initialized successfully")
        
        print("[Main] Initializing Orchestrator...")
        orchestrator = RiskMonitoringOrchestrator()
        print("[Main] ✓ Orchestrator initialized")
        
        print("[Main] Starting monitoring loop task...")
        asyncio.create_task(orchestrator.continuous_monitoring_loop(manager))
        print("[Main] ✓ Risk Monitoring Orchestrator started")
    except Exception as e:
        print(f"⚠ Warning: Startup background tasks failed: {e}")
        import traceback
        traceback.print_exc()
        print("Backend is running in partial mode (No database/orchestrator).")
        
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Clinical Cortex",
    version="1.0.0",
    description="AI-Powered Clinical Risk Monitoring & Decision Support Platform",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(vitals.router, prefix="/api/vitals", tags=["Vitals"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(demo.router, prefix="/api/demo", tags=["Demo"])

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return None

@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
async def root():
    return {"message": "Clinical Cortex API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
