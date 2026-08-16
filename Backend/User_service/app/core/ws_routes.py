from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.ws_manager import ws_manager
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Realtime WebSocket"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    org_id: str = Query(default="default_org")
):
    """
    Live real-time WebSocket connection for instant event propagation.
    Clients receive updates for staff, roles, permissions, branches, and bills.
    """
    await ws_manager.connect(websocket, org_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type":"pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, org_id)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket, org_id)
