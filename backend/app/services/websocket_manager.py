import json
import logging
from typing import Dict, Set, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Authoritative Real-Time WebSocket Hub for KissanSetuAI.
    Coordinates live negotiation messaging, bidding updates, and instant in-app alerts.
    """

    def __init__(self):
        # Map room_id -> Set of active WebSocket connections
        self.rooms: Dict[str, Set[WebSocket]] = {}
        # Map user_id -> Set of active user notification WebSockets
        self.user_sockets: Dict[str, Set[WebSocket]] = {}

    async def connect_to_room(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(websocket)
        logger.info(f"[WS] Connected to room {room_id}. Total active in room: {len(self.rooms[room_id])}")

    def disconnect_from_room(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].discard(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]
        logger.info(f"[WS] Disconnected from room {room_id}")

    async def broadcast_to_room(self, room_id: str, data: Dict[str, Any]):
        if room_id not in self.rooms:
            return
        dead_sockets = set()
        for ws in self.rooms[room_id]:
            try:
                await ws.send_text(json.dumps(data))
            except Exception as exc:
                logger.warning(f"[WS] Failed sending to client in room {room_id}: {exc}")
                dead_sockets.add(ws)

        for dead in dead_sockets:
            self.rooms[room_id].discard(dead)

    async def connect_user(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        uid = str(user_id)
        if uid not in self.user_sockets:
            self.user_sockets[uid] = set()
        self.user_sockets[uid].add(websocket)

    def disconnect_user(self, websocket: WebSocket, user_id: str):
        uid = str(user_id)
        if uid in self.user_sockets:
            self.user_sockets[uid].discard(websocket)
            if not self.user_sockets[uid]:
                del self.user_sockets[uid]

    async def send_to_user(self, user_id: str, data: Dict[str, Any]):
        uid = str(user_id)
        if uid not in self.user_sockets:
            return
        dead_sockets = set()
        for ws in self.user_sockets[uid]:
            try:
                await ws.send_text(json.dumps(data))
            except Exception as exc:
                logger.warning(f"[WS] Failed sending notification to user {uid}: {exc}")
                dead_sockets.add(ws)

        for dead in dead_sockets:
            self.user_sockets[uid].discard(dead)


websocket_manager = WebSocketManager()
