from fastapi import WebSocket
from typing import List, Dict, Any
import json
import logging

logger = logging.getLogger("causalmesh-ws")


class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message_type: str, data: Dict[str, Any]):
        if not self.active_connections:
            return
        payload = json.dumps({"type": message_type, "data": data})
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.error(f"Error sending ws frame: {e}")
                self.disconnect(connection)


ws_manager = WebSocketManager()
