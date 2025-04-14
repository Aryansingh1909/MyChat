import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://mychat-k4wp.onrender.com" : "/api",
  withCredentials: true,
});
