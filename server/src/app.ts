import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const PORT = 3050;

const server = http.createServer(app);

// This is to get rid of Chrome's CORS error
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
  },
});

app.use(cors());

type VideoControlEvent = {
  type: "PLAY" | "PAUSE";
  progress: number;
};

type SessionProps = {
  videoUrl: string;
  users: Set<string>;
  events: VideoControlEvent[];
};

const sessionData = new Map<string, SessionProps>();

// Creates a new session with a URL
app.post("/session", async (req, res) => {
  const { sessionId, url } = req.body;
  sessionData.set(sessionId, {
    videoUrl: url,
    users: new Set(),
    events: [],
  });
  res.sendStatus(201);
});

// Gets a session's data
app.get("/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = sessionData.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json({ videoUrl: session.videoUrl });
});

io.on("connection", (socket) => {
  console.log(`A user has connected with socket id ${socket.id}`);

  // Handle joining a session
  socket.on("joinSession", async (sessionId, callback) => {
    const currentSession = sessionData.get(sessionId);
    if (!currentSession) return;

    // Add user to the session
    currentSession.users.add(socket.id);
    socket.join(sessionId);

    const lastEvent = currentSession.events[currentSession.events.length - 1];

    // Return the session's data to the user that just joined
    const responseData = {
      videoUrl: currentSession.videoUrl,
      progress: lastEvent?.progress ?? 0,
      isPlaying: lastEvent ? lastEvent.type === "PLAY" : false,
    };
    console.log(`Sending session state to user ${socket.id}:`, responseData);
    callback(responseData);
  });

  // Handle video control events from the client
  socket.on("videoControl", (sessionId, videoControl: VideoControlEvent) => {
    console.log(
      `Received video control from client ${socket.id} in session ${sessionId}:`,
      videoControl
    );

    const currentSession = sessionData.get(sessionId);

    if (!currentSession) return;

    // Store the event in the session
    currentSession.events.push(videoControl);

    // Broadcast the video control event to all watchers in the session except the sender
    socket.to(sessionId).emit("videoControl", socket.id, videoControl);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User ${socket.id} has disconnected`);
    // Remove the user from all sessions they were in
    for (const [sessionId, sessionState] of sessionData) {
      const { users } = sessionState;
      if (users.delete(socket.id)) {
        socket.leave(sessionId);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
