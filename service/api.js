import axios from "axios";

export const api = axios.create({
  timeout: 30000, // 30secs
  baseURL: "https://api.showkarma.xyz/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});
