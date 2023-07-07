const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();
app.use(bodyParser.json());

const PORT = 3050;

const server = http.createServer(app);

// This is to get rid of Chrome's CORS error
const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
  },
});

app.use(cors());

// Get video by ID
app.get("/video/:videoId", async (req, res) => {
  const { videoId } = req.params;
  const video = await db.getVideo(videoId);
  res.json(video);
});

// Create a new video with an ID (Session ID)
app.post("/video", async (req, res) => {
  const { videoId, url } = req.body;
  await db.createNewVideo(videoId, url);
  res.sendStatus(201);
});

// Create a videoControl event
app.post("/videoControl", async (req, res) => {
  const { videoId, type, progress } = req.body;
  await db.createVideoControl(videoId, type, progress);
  res.sendStatus(201);
});

// Get latest videoControl event of a video
app.get("/videoControl/:videoId", async (req, res) => {
  const { videoId } = req.params;
  const lastVideoControl = await db.getLastVideoControl(videoId);
  res.json(lastVideoControl);
});

app.post("/video/:videoId/end", async (req, res) => {
  const { videoId } = req.params;

  // End the live session so it doesn't keep playing even when last user leaves the page
  db.markVideoEnd(videoId);
  db.createVideoControl(videoId, "END");
  res.sendStatus(200);
});

const sessions = new Map();

io.on("connection", (socket) => {
  console.log(`A user has connected with socket id ${socket.id}`);

  // Handle joining a session
  socket.on("joinSession", (sessionId, callback) => {
    // Create a new session if it doesn't exist
    if (!sessions.has(sessionId)) {
      // set the video as "ENDED" so the frontend knows it is safe to start playing from 0
      db.createVideoControl(sessionId, "END", 0);
      sessions.set(sessionId, new Set());
    }

    // Add the user to the session
    const users = sessions.get(sessionId);
    users.add(socket.id);
    socket.join(sessionId);

    // Broadcast to all users in the session that a new user has joined
    io.to(sessionId).emit("userJoined", socket.id, [...users]);
    callback({
      users: [...users],
    });
  });

  // Handle video control events from the client
  socket.on("videoControl", (sessionId, videoControl) => {
    console.log(
      `Received video control from client ${socket.id} in session ${sessionId}:`,
      videoControl
    );
    // non-blocking insert
    db.createVideoControl(sessionId, videoControl.type, videoControl.progress);
    // Broadcast the video control event to all watchers in the session except the sender
    socket.to(sessionId).emit("videoControl", socket.id, videoControl);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User ${socket.id} has disconnected`);
    // Remove the user from all sessions they were in
    for (const [sessionId, users] of sessions) {
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
