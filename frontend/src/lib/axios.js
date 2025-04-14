import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://mychat-k4wp.onrender.com/api" ,
  withCredentials: true,
});
