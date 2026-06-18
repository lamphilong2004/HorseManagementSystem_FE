import axios from "axios";

import { loadSession } from "./sessionStorage";

export class ApiException extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "ApiException";
    this.statusCode = statusCode;
  }
}

export class ApiClient {
  constructor() {
    this.accessToken = null;
    this.client = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || "https://managerhourse-be.onrender.com",
      headers: { "Content-Type": "application/json" }
    });

    this.client.interceptors.request.use(async (config) => {
      const token = this.accessToken || (await this.loadStoredToken());
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  setAccessToken(token) {
    this.accessToken = token || null;
  }

  async loadStoredToken() {
    const session = await loadSession();
    this.accessToken = session?.token || null;
    return this.accessToken;
  }

  async get(path) {
    return this.send(() => this.client.get(path));
  }

  async post(path, body = {}) {
    return this.send(() => this.client.post(path, body));
  }

  async patch(path, body) {
    return this.send(() => this.client.patch(path, body));
  }

  async send(request) {
    try {
      return await request();
    } catch (error) {
      throw toApiException(error);
    }
  }
}

function toApiException(error) {
  const response = error?.response;
  const data = response?.data;
  let message = "Failed";

  if (data && typeof data === "object") {
    message = String(data.message || data.error || message);
  } else if (typeof data === "string" && data.length > 0) {
    message = data;
  } else if (error?.message) {
    message = error.message;
  }

  return new ApiException(message, response?.status);
}
