"""
WebSocket pour les notifications en temps réel
"""
from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json
from app.core.deps import get_current_active_user
from app.models.user import User

class NotificationManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_notification(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except WebSocketDisconnect:
                    await self.disconnect(connection, user_id)

    async def broadcast(self, message: dict, exclude_user: int = None):
        for user_id, connections in self.active_connections.items():
            if user_id != exclude_user:
                for connection in connections:
                    try:
                        await connection.send_json(message)
                    except WebSocketDisconnect:
                        await self.disconnect(connection, user_id)

notification_manager = NotificationManager()

async def get_token(websocket: WebSocket):
    """Récupère le token JWT depuis les paramètres de la connexion WebSocket"""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Token manquant")
        return None
    return token

async def ws_notification_endpoint(
    websocket: WebSocket,
    user: User = Depends(get_current_active_user)
):
    """Endpoint WebSocket pour les notifications en temps réel"""
    await notification_manager.connect(websocket, user.id)
    try:
        while True:
            # Attendre les messages du client (ping/pong pour maintenir la connexion)
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        notification_manager.disconnect(websocket, user.id)

# Fonction utilitaire pour envoyer des notifications
async def send_notification(user_id: int, notification_type: str, title: str, message: str, data: dict = None):
    """Envoie une notification à un utilisateur via WebSocket"""
    notification = {
        "type": notification_type,
        "title": title,
        "message": message,
        "data": data or {},
        "timestamp": str(datetime.now())
    }
    await notification_manager.send_notification(user_id, notification)
