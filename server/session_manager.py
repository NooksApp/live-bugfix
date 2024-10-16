from typing import Dict, List

class VideoControlEvent:
    def __init__(self, type: str, progress: float):
        self.type = type
        self.progress = progress

class Session:
    def __init__(self, video_url: str):
        self.video_url = video_url
        self.events: List[VideoControlEvent] = []

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, Session] = {}

    def create_session(self, sessionId: str, video_url: str):
        self.sessions[sessionId] = Session(video_url)

    def get_session(self, sessionId: str) -> Session:
        return self.sessions.get(sessionId)

    def add_event(self, sessionId: str, event_type: str, progress: float):
        if session := self.get_session(sessionId):
            event = VideoControlEvent(event_type, progress)
            session.events.append(event)

    def get_last_event(self, sessionId: str) -> VideoControlEvent:
        if session := self.get_session(sessionId):
            return session.events[-1] if session.events else None
        return None
