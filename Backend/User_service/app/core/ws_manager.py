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
        try:
            await websocket.accept()
            self.all_connections.append(websocket)
            if organization_id:
                if organization_id not in self.active_connections:
                    self.active_connections[organization_id] = []
                self.active_connections[organization_id].append(websocket)
            logger.info(f"WebSocket connected (Total: {len(self.all_connections)}, Org: {organization_id})")
        except Exception as e:
            logger.warning(f"WebSocket accept failed: {e}")

    def disconnect(self, websocket: WebSocket, organization_id: Optional[str] = None):
        try:
            if websocket in self.all_connections:
                self.all_connections.remove(websocket)
            if organization_id and organization_id in self.active_connections:
                if websocket in self.active_connections[organization_id]:
                    self.active_connections[organization_id].remove(websocket)
            logger.info(f"WebSocket disconnected (Total: {len(self.all_connections)})")
        except Exception:
            pass

    async def broadcast_to_org(self, organization_id: str, event_type: str, payload: dict = None):
        if not self.all_connections and not self.active_connections:
            return

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

        # Global subscribers
        for conn in list(self.all_connections):
            if conn not in org_conns:
                try:
                    await conn.send_text(message)
                except Exception:
                    self.disconnect(conn)

    def trigger_event(self, organization_id: str, event_type: str, payload: dict = None):
        """Safely trigger async broadcast without ever crashing the HTTP event loop."""
        try:
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(self.broadcast_to_org(organization_id, event_type, payload))
            except RuntimeError:
                pass
        except Exception as e:
            logger.warning(f"WebSocket broadcast skipped: {e}")


ws_manager = WebSocketManager()
