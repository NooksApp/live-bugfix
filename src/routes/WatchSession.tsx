import { useEffect, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, TextField, Tooltip } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import io from "socket.io-client";

const socket = io("http://localhost:3050");

const WatchSession: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [linkCopied, setLinkCopied] = useState(false);

  return (
    <>
      <Box
        width="100%"
        maxWidth={1000}
        display="flex"
        gap={1}
        marginTop={1}
        alignItems="center"
      >
        <TextField
          label="Youtube URL"
          variant="outlined"
          value={""}
          inputProps={{
            readOnly: true,
            disabled: true,
          }}
          fullWidth
        />
        <Tooltip title={linkCopied ? "Link copied" : "Copy link to share"}>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 2000);
            }}
            disabled={linkCopied}
            variant="contained"
            sx={{ whiteSpace: "nowrap", minWidth: "max-content" }}
          >
            <LinkIcon />
          </Button>
        </Tooltip>
        <Tooltip title="Create new watch party">
          <Button
            onClick={() => {
              navigate("/create");
            }}
            variant="contained"
            sx={{ whiteSpace: "nowrap", minWidth: "max-content" }}
          >
            <AddCircleOutlineIcon />
          </Button>
        </Tooltip>
      </Box>
      {sessionId && <VideoPlayer socket={socket} sessionId={sessionId} />}
    </>
  );
};

export default WatchSession;
