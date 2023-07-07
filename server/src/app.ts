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
  type: "PLAY" | "PAUSE" | "END";
  progress: number;
  createdAt: number;
};

type SessionProps = {
  videoUrl: string;
  users: Set<string>;
  lastVideoControlEvent?: VideoControlEvent;
};

const sessionData = new Map<string, SessionProps>();
const sessions = new Map();

// Creates a new session with a URL
app.post("/session", async (req, res) => {
  const { sessionId, url } = req.body;
  sessionData.set(sessionId, {
    videoUrl: url,
    users: new Set(),
  });
  res.sendStatus(201);
});

// Gets the last video control event from a session (for joining late)
app.get("/session/:sessionId/lastVideoEvent", async (req, res) => {
  const { sessionId } = req.params;

  const lastEvent = sessionData.get(sessionId)?.lastVideoControlEvent;

  // If there is no recent event, send undefined so the frontend knows to play from start
  res.send(lastEvent).status(200);
});

// Ends a live session
app.post("/session/:sessionId/end", async (req, res) => {
  const { sessionId } = req.params;
  const currentSession = sessionData.get(sessionId);

  if (!currentSession) return;

  // Write an "END" event so the video doesn't keep playing when last user leaves the page
  currentSession.lastVideoControlEvent = {
    type: "END",
    progress: 0,
    createdAt: Date.now(),
  };

  res.sendStatus(200);
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

    // Broadcast to all users in the session that a new user has joined
    io.to(sessionId).emit("userJoined", socket.id, [...currentSession.users]);

    // Return the session's data to the user that just joined
    callback({
      videoUrl: currentSession.videoUrl,
      users: [...currentSession.users],
    });
  });

  // Handle video control events from the client
  socket.on("videoControl", (sessionId, videoControl) => {
    console.log(
      `Received video control from client ${socket.id} in session ${sessionId}:`,
      videoControl
    );

    const currentSession = sessionData.get(sessionId);

    if (!currentSession) return;

    // Store last event (needed for late to the party)
    currentSession.lastVideoControlEvent = {
      type: videoControl.type,
      progress: videoControl.progress,
      createdAt: Date.now(),
    };

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
        io.to(sessionId).emit("userLeft", socket.id, [...users]);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
