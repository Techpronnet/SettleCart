import logging
from uuid import UUID
from fastapi import WebSocket
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps order_id -> list of active WebSocket connections
        self.active_connections: Dict[UUID, List[WebSocket]] = {}

    async def connect(self, order_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        if order_id not in self.active_connections:
            self.active_connections[order_id] = []
        self.active_connections[order_id].append(websocket)
        logger.info("WebSocket client connected to order %s (Total: %d)", order_id, len(self.active_connections[order_id]))

    def disconnect(self, order_id: UUID, websocket: WebSocket) -> None:
        if order_id in self.active_connections:
            if websocket in self.active_connections[order_id]:
                self.active_connections[order_id].remove(websocket)
            if not self.active_connections[order_id]:
                del self.active_connections[order_id]
        logger.info("WebSocket client disconnected from order %s", order_id)

    async def send_event(self, websocket: WebSocket, event: dict[str, Any]) -> None:
        try:
            await websocket.send_json(event)
        except Exception as exc:
            logger.debug("Failed to send WebSocket message: %s", exc)

    async def broadcast_to_order(self, order_id: UUID, event: dict[str, Any]) -> None:
        connections = self.active_connections.get(order_id, [])
        for connection in list(connections):
            try:
                await connection.send_json(event)
            except Exception as exc:
                logger.debug("Removing failed connection from order %s: %s", order_id, exc)
                self.disconnect(order_id, connection)

ws_manager = ConnectionManager()

