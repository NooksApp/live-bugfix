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
  id: number;
  videoId: string;
  progress: number;
  type: "PLAY" | "PAUSE" | "END";
  // epoch in milisecond
  createdAt: number;
}

export const getVideo = async (videoId: string): Promise<IVideo> => {
  try {
    const response = await apiClient.get(`/video/${videoId}`);
    return response.data;
  } catch (error) {
    console.error("Error getting video:", error);
    throw error;
  }
};

export const createVideo = async (
  videoId: string,
  url: string
): Promise<void> => {
  try {
    await apiClient.post("/video", { videoId, url });
  } catch (error) {
    console.error("Error creating video:", error);
    throw error;
  }
};

export const createVideoControl = async (
  videoId: string,
  type: string,
  progress: number
): Promise<void> => {
  try {
    await apiClient.post("/videoControl", { type, progress, videoId });
  } catch (error) {
    console.error("Error creating video control:", error);
    throw error;
  }
};

export const getLastVideoControl = async (
  videoId: string
): Promise<IVideoControl> => {
  try {
    const response = await apiClient.get(`/videoControl/${videoId}`);
    return response.data;
  } catch (error) {
    console.error("Error getting last video control:", error);
    throw error;
  }
};

export const endVideo = (videoId: string): void => {
  try {
    // send a beacon - async request that doesn't expect a response
    navigator.sendBeacon(`/video/${videoId}/end`);
  } catch (error) {
    console.error("Error ending video: ", error);
    throw error;
  }
};
