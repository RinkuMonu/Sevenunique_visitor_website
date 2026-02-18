import axios from "axios";

// Axios instance create
const axiosInstance = axios.create({
  // baseURL: "http://localhost:5001/api",
  baseURL: "https://visitor-backend-t6nh.onrender.com/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// 🔥 Request Interceptor (Token automatically attach karega)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // ya jaha tum store karte ho
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔥 Response Interceptor (Global error handle)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized! Redirect to login");
      // yaha logout logic bhi laga sakte ho
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
