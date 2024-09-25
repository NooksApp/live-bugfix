import { Box, Button } from "@mui/material";
import React, { useRef, useState } from "react";
import ReactPlayer from "react-player";
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

  React.useEffect(() => {
    // join session on init

    socket.emit("joinSession", sessionId, (response: JoinSessionResponse) => {
      console.log("Response after joining session: ", response);
      setUrl(response.videoUrl);
    });
  }, []);

  const handleWatchStart = async () => {
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

    setHasJoined(true);
  };

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
