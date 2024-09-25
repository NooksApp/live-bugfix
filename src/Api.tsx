import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3050",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface IVideo {
  id: string;
  isSessionEnd: number;
  createdAt: number;
  url: string;
  // epoch in milisecond
  updatedAt: number;
}

export interface IVideoControl {
  progress: number;
  type: "PLAY" | "PAUSE" | "END";
  // epoch in milisecond
  createdAt: number;
}

export const createSession = async (
  sessionId: string,
  url: string
): Promise<void> => {
  try {
    await apiClient.post("/session", { sessionId, url });
  } catch (error) {
    console.error("Error creating video:", error);
    throw error;
  }
};
