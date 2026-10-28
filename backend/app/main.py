import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.api.routes import router as api_router
from app.services.ws_manager import ws_manager

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CausalMesh SRM: Real-Time Blast Radius Engine & PuLP LP Solver"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router)


@app.get("/health")
def health_check():
    return {"status": "HEALTHY", "engine": "CausalMesh Dynamic Graph v1.0", "mode": "PRODUCTION_LIVE"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


# -------------------------------------------------------------
# Static Frontend Serving & SPA Routing
# -------------------------------------------------------------
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend_dist"))

if os.path.exists(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Prevent intercepting API, documentation, or WebSocket routes
        if (
            full_path.startswith("api/")
            or full_path.startswith("ws")
            or full_path in ["docs", "openapi.json", "redoc", "health"]
        ):
            raise HTTPException(status_code=404, detail="Resource not found")

        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)

        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)

        return {"status": "Frontend ready."}
