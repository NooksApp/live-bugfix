from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import socketio
from session_manager import SessionManager
import uvicorn

app = FastAPI()
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=['http://localhost:3000'],
)
socket_app = socketio.ASGIApp(sio, app)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session_manager = SessionManager()

class SessionCreate(BaseModel):
    sessionId: str
    url: str

@app.post("/session")
async def create_session(session: SessionCreate):
    session_manager.create_session(session.sessionId, session.url)
    return {"status": "created"}

@app.get("/session/{session_id}")
async def get_session(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        return {"error": "Session not found"}
    return {"videoUrl": session.video_url}


@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    for sessionId, session in session_manager.sessions.items():
        if sid in session.users:
            session.users.remove(sid)
            await sio.emit('userLeft', {'userId': sid, 'users': list(session.users)}, room=sessionId)

@sio.event
async def joinSession(sid, sessionId):
    session = session_manager.get_session(sessionId)
    if not session:
        return {'error': 'Session not found'}

    await sio.enter_room(sid, sessionId)
    session.users.add(sid)

    await sio.emit('userJoined', {'userId': sid, 'users': list(session.users)}, room=sessionId, skip_sid=sid)

    last_event = session_manager.get_last_event(sessionId)
    return {
        'videoUrl': session.video_url,
        'users': list(session.users),
        'progress': last_event.progress if last_event else 0,
        'isPlaying': last_event.type == "PLAY" if last_event else False  # Add this line
    }

@sio.event
async def videoControl(sid, *args):
    print(f"Received videoControl event from {sid}")
    print(f"Arguments: {args}")
    
    if len(args) == 2:
        sessionId, videoControl = args
    else:
        print(f"Unexpected format for videoControl event: {args}")
        return

    if sessionId and videoControl:
        session_manager.add_event(sessionId, videoControl['type'], videoControl['progress'])
        print(f"Broadcasting videoControl: sessionId={sessionId}, videoControl={videoControl}")
        await sio.emit('videoControl', {'userId': sid, 'videoControl': videoControl}, room=sessionId, skip_sid=sid)
    else:
        print(f"Invalid data for videoControl event: sessionId={sessionId}, videoControl={videoControl}")

if __name__ == '__main__':
    uvicorn.run(socket_app, host="0.0.0.0", port=3050)
