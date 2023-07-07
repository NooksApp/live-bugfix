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

export const getLastVideoEvent = async (
  sessionId: string
): Promise<IVideoControl> => {
  try {
    const response = await apiClient.get(
      `/session/${sessionId}/lastVideoEvent`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting last video control:", error);
    throw error;
  }
};

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

export const endSession = (sessionId: string): void => {
  try {
    // send a beacon - async request that doesn't expect a response
    navigator.sendBeacon(`/session/${sessionId}/end`);
  } catch (error) {
    console.error("Error ending video: ", error);
    throw error;
  }
};
