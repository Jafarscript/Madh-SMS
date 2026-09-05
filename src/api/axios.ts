import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// if the token is invalid/expired on a protected route, send the user back to
// login instead of letting every page show a confusing "failed to load" error.
// We DO NOT redirect if the user is already on a public route (e.g. login, register, forgot-password).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const publicPaths = ["/login", "/register", "/forgot-password"];
      const isPublicPath =
        typeof window !== "undefined" &&
        publicPaths.some((p) => window.location.pathname.startsWith(p));

      if (!isPublicPath) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;