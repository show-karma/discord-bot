import axios from "axios";

export const api = axios.create({
  timeout: 30000, // 30secs
  baseURL: process.env.PROD_API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});
