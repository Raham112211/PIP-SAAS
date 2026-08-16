from typing import Dict, List, Optional
from fastapi import WebSocket
import json
import logging
import asyncio

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.all_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, organization_id: Optional[str] = None):
        await websocket.accept()
        self.all_connections.append(websocket)
        if organization_id:
            if organization_id not in self.active_connections:
                self.active_connections[organization_id] = []
            self.active_connections[organization_id].append(websocket)
        logger.info(f"WebSocket connected (Total: {len(self.all_connections)}, Org: {organization_id})")

    def disconnect(self, websocket: WebSocket, organization_id: Optional[str] = None):
        if websocket in self.all_connections:
            self.all_connections.remove(websocket)
        if organization_id and organization_id in self.active_connections:
            if websocket in self.active_connections[organization_id]:
                self.active_connections[organization_id].remove(websocket)
        logger.info(f"WebSocket disconnected (Total: {len(self.all_connections)})")

    async def broadcast_to_org(self, organization_id: str, event_type: str, payload: dict = None):
        message = json.dumps({
            "type": event_type,
            "payload": payload or {},
            "org_id": organization_id
        })
        
        # Org specific listeners
        org_conns = list(self.active_connections.get(organization_id, []))
        for conn in org_conns:
            try:
                await conn.send_text(message)
            except Exception:
                self.disconnect(conn, organization_id)

        # Global subscribers (admins / dashboard)
        for conn in list(self.all_connections):
            if conn not in org_conns:
                try:
                    await conn.send_text(message)
                except Exception:
                    self.disconnect(conn)

    def trigger_event(self, organization_id: str, event_type: str, payload: dict = None):
        """Synchronous wrapper to safely trigger async broadcast from route handlers."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self.broadcast_to_org(organization_id, event_type, payload))
            else:
                loop.run_until_complete(self.broadcast_to_org(organization_id, event_type, payload))
        except RuntimeError:
            # Create a new event loop if none exists in current thread
            try:
                asyncio.run(self.broadcast_to_org(organization_id, event_type, payload))
            except Exception as e:
                logger.warning(f"Failed to broadcast websocket event {event_type}: {e}")


ws_manager = WebSocketManager()
