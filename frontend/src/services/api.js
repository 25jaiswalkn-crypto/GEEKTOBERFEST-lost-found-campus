import axios from "axios";

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const getImageValidationError = (file) => {
  if (!file) return "";

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Unsupported image type. Please upload a JPEG, PNG, WebP, or GIF image.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "Image is too large. Maximum allowed size is 5 MB.";
  }

  return "";
};

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;