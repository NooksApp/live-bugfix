import { Box, Button } from "@mui/material";
import React, { useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { Socket } from "socket.io-client";

interface VideoPlayerProps {
  socket: Socket;
  sessionId: string;
  url: string;
}

interface IVideoControlProps {
  type: "PLAY" | "PAUSE";
  progress: number;
}

interface JoinSessionResponse {
  videoUrl: string;
  progress: number;
  isPlaying: boolean; // Add this line
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  socket,
  sessionId,
  url,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(false);
  const [played, setPlayed] = useState(0);

  const player = useRef<ReactPlayer>(null);

  useEffect(() => {
    socket.on(
      "videoControl",
      ({
        userId,
        videoControl,
      }: {
        userId: string;
        videoControl: IVideoControlProps;
      }) => {
        console.log("Received video control event: ", userId, videoControl);
        if (videoControl.type === "PLAY") {
          playVideoAtProgress(videoControl.progress);
        } else if (videoControl.type === "PAUSE") {
          pauseVideoAtProgress(videoControl.progress);
        }
        setPlayed(videoControl.progress);
      }
    );

    return () => {
      socket.off("videoControl");
    };
  }, [socket]);

  useEffect(() => {
    console.log("Played: ", played);
  }, [played]);

  const handleWatchStart = async () => {
    socket.emit("joinSession", sessionId, (response: JoinSessionResponse) => {
      setHasJoined(true);
      console.log("Received join session response: ", response);
      if (response.progress > 0) {
        seekToVideo(response.progress);
        if (response.isPlaying) {
          playVideo();
        }
        setPlayed(response.progress);
        setPlayingVideo(response.isPlaying);
      }
    });
  };

  function playVideo() {
    player.current?.getInternalPlayer().playVideo();
  }

  function pauseVideo() {
    player.current?.getInternalPlayer().pauseVideo();
  }

  function seekToVideo(progress: number) {
    player.current?.seekTo(progress, "seconds");
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

  const handleEnded = () => {
    socket!.emit("videoControl", sessionId, {
      type: "PAUSE",
      progress: 0,
    });
    pauseVideoAtProgress(0);
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

  const handleSeekChange = (e: any) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e: any) => {
    const progress = parseFloat(e.target.value);
    socket!.emit("videoControl", sessionId, {
      type: "PLAY",
      progress: progress,
    });
    playVideoAtProgress(progress);
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
            playing={playingVideo}
            controls={false}
            onReady={handleReady}
            onEnded={handleEnded}
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
              min={0}
              max={player.current?.getDuration() ?? 1}
              step="any"
              value={played}
              onChange={(e) => handleSeekChange(e)}
              onMouseUp={(e) => handleSeekMouseUp(e)}
            />
          </div>
        </Box>
      )}
      {isReady && !hasJoined && (
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
