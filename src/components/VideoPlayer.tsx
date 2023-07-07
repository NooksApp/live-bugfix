import { Box, Button } from "@mui/material";
import React, { useCallback, useRef, useState } from "react";
import ReactPlayer from "react-player";
import * as Api from "../Api";
import { Socket } from "socket.io-client";

const MIN_VIDEO_PROGRESS = 0;
const MAX_VIDEO_PROGRESS = 0.999999;

interface IVideoPlayerProps {
  sessionId: string;
  socket: Socket;
}

interface IVideoControlProps {
  type: "PLAY" | "PAUSE" | "END";
  progress: number;
}

interface JoinSessionResponse {
  videoUrl: string;
  users: String[];
}

const VideoPlayer: React.FC<IVideoPlayerProps> = ({ socket, sessionId }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [played, setPlayed] = useState(0);

  const player = useRef<ReactPlayer>(null);
  const [users, setUsers] = useState<Set<String>>(new Set());

  React.useEffect(() => {
    // join session on init
    socket.emit("joinSession", sessionId, (response: JoinSessionResponse) => {
      console.log("Response after joining session: ", response);
      setUrl(response.videoUrl);
      setUsers(new Set(response.users));
    });
  }, []);

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      if (users.size <= 1) {
        Api.endSession(sessionId);
      }
    };

    // set up handler to end video when page closes
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [users, sessionId]);

  function playVideo() {
    player.current?.getInternalPlayer().playVideo();
  }

  function pauseVideo() {
    player.current?.getInternalPlayer().pauseVideo();
  }

  function seekToVideo(progress: number) {
    player.current?.seekTo(progress);
  }

  function playVideoAtProgress(progress: number) {
    seekToVideo(progress);
    playVideo();
    setPlayingVideo(true);
  }

  function pauseVideoAtProgress(progress: number) {
    seekToVideo(progress);
    pauseVideo();
    setPlayingVideo(false);
  }

  const handleReady = () => {
    setIsReady(true);
  };

  const handlePlayPause = () => {
    if (playingVideo) {
      socket!.emit("videoControl", sessionId, {
        type: "PAUSE",
        progress: played,
      });
      pauseVideo();
    } else {
      socket!.emit("videoControl", sessionId, {
        type: "PLAY",
        progress: played,
      });
      playVideo();
    }
    setPlayingVideo(!playingVideo);
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekChange = (e: any) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e: any) => {
    setSeeking(false);
    const progress = parseFloat(e.target.value);
    socket!.emit("videoControl", sessionId, {
      type: "PLAY",
      progress: progress,
    });
    playVideoAtProgress(progress);
  };

  const handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    if (!seeking) {
      setPlayed(state.played === 1 ? MAX_VIDEO_PROGRESS : state.played);
    }
  };

  const handleWatchStart = async () => {
    const lastVideoEvent = await Api.getLastVideoEvent(sessionId);

    // When joining late to the party
    if (lastVideoEvent.type === "PLAY") {
      // Need to calculate how much time has elapsed since "PLAY" event fired
      // to know where to start the video at
      const newVideoProgress = Math.min(
        MAX_VIDEO_PROGRESS,
        lastVideoEvent.progress +
          (Date.now() - lastVideoEvent.createdAt) /
            (player.current?.getDuration()! * 1000)
      );
      playVideoAtProgress(newVideoProgress);
      setPlayed(newVideoProgress);
    } else if (lastVideoEvent.type === "PAUSE") {
      pauseVideoAtProgress(lastVideoEvent.progress);
      setPlayed(lastVideoEvent.progress);
    } else {
      // no video events yet or session was ended, just start video normally from beginning
      handlePlayPause();
    }

    // register to listen to video control events from socket
    socket.on(
      "videoControl",
      (senderId: string, control: IVideoControlProps) => {
        if (control.type === "PLAY") {
          playVideoAtProgress(control.progress);
          setPlayed(control.progress);
        } else if (control.type === "PAUSE") {
          pauseVideoAtProgress(control.progress);
          setPlayed(control.progress);
        }
      }
    );

    socket.on("userJoined", (userId: string) => {
      setUsers((users) => {
        users.add(userId);
        return users;
      });
    });

    socket.on("userLeft", (userId: string) => {
      setUsers((users) => {
        users.delete(userId);
        return users;
      });
    });

    setHasJoined(true);
  };

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
    >
      {url && (
        <Box
          width="100%"
          height="100%"
          display={hasJoined ? "flex" : "none"}
          flexDirection="column"
        >
          <ReactPlayer
            ref={player}
            url={url}
            playing={false}
            controls={false}
            onReady={handleReady}
            onProgress={handleProgress}
            width="100%"
            height="100%"
            style={{ pointerEvents: "none" }}
          />
          <div>
            <button
              style={{ display: "block" }}
              onClick={() => handlePlayPause()}
            >
              {playingVideo ? "Pause" : "Play"}
            </button>
            <input
              style={{ display: "block", width: "100%" }}
              type="range"
              min={MIN_VIDEO_PROGRESS}
              max={MAX_VIDEO_PROGRESS}
              step="any"
              value={played}
              onMouseDown={() => handleSeekMouseDown()}
              onChange={(e) => handleSeekChange(e)}
              onMouseUp={(e) => handleSeekMouseUp(e)}
            />
          </div>
        </Box>
      )}
      {!hasJoined && isReady && (
        // Youtube doesn't allow autoplay unless you've interacted with the page already
        // So we make the user click "Join Session" button and then start playing the video immediately after
        // This is necessary so that when people join a session, they can seek to the same timestamp and start watching the video with everyone else
        <Button
          variant="contained"
          size="large"
          onClick={() => handleWatchStart()}
        >
          Watch Session
        </Button>
      )}
    </Box>
  );
};

export default VideoPlayer;
