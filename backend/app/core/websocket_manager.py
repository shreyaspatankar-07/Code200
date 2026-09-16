"""
Real-Time WebSocket Gateway Manager (/ws/doctor)
Broadcasting sub-millisecond red-flag alerts, new patient submissions, and verification events.
"""

from typing import List, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
import json
import logging

logger = logging.getLogger("medikiosk.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Doctor OPD Console connected. Total active sessions: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Doctor OPD Console disconnected. Remaining sessions: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """
        Broadcasts JSON payload to all active Doctor OPD consoles.
        """
        payload = json.dumps(message)
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending to connection: {e}")
                disconnected.append(connection)
        
        for dead_conn in disconnected:
            self.disconnect(dead_conn)

    async def broadcast_red_flag(self, alert_data: Dict[str, Any]):
        await self.broadcast({
            "type": "RED_FLAG_EMERGENCY",
            "data": alert_data
        })

    async def broadcast_intake_submit(self, patient_data: Dict[str, Any]):
        await self.broadcast({
            "type": "PATIENT_INTAKE_SUBMITTED",
            "data": patient_data
        })

    async def broadcast_token_verified(self, verification_data: Dict[str, Any]):
        await self.broadcast({
            "type": "TOKEN_VERIFIED",
            "data": verification_data
        })

ws_manager = ConnectionManager()
