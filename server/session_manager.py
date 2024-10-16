from typing import Dict, Set, List

class VideoControlEvent:
    def __init__(self, type: str, progress: float):
        self.type = type
        self.progress = progress

class Session:
    def __init__(self, video_url: str):
        self.video_url = video_url
        self.users: Set[str] = set()
        self.events: List[VideoControlEvent] = []

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, Session] = {}

    def create_session(self, sessionId: str, video_url: str):
        self.sessions[sessionId] = Session(video_url)

    def get_session(self, sessionId: str) -> Session:
        return self.sessions.get(sessionId)

    def add_user_to_session(self, sessionId: str, user_id: str):
        if session := self.get_session(sessionId):
            session.users.add(user_id)

    def remove_user_from_session(self, sessionId: str, user_id: str):
        if session := self.get_session(sessionId):
            session.users.discard(user_id)

    def get_user_ids(self, sessionId: str) -> list[str]:
        if session := self.get_session(sessionId):
            return list(session.users)
        return []

    def add_event(self, sessionId: str, event_type: str, progress: float):
        if session := self.get_session(sessionId):
            event = VideoControlEvent(event_type, progress)
            session.events.append(event)

    def get_last_event(self, sessionId: str) -> VideoControlEvent:
        if session := self.get_session(sessionId):
            return session.events[-1] if session.events else None
        return None
