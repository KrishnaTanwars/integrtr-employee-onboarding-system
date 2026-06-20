import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/* ---------------- REQUEST INTERCEPTOR (DEBUGGING) ---------------- */
API.interceptors.request.use((req) => {
  console.log("🚀 API REQUEST:", req.method, req.url);
  return req;
});

/* ---------------- RESPONSE INTERCEPTOR (DEBUGGING) ---------------- */
API.interceptors.response.use(
  (res) => {
    console.log("✅ API RESPONSE:", res.data);
    return res;
  },
  (err) => {
    console.log("❌ API ERROR:", err.response?.data || err.message);
    return Promise.reject(err);
  }
);

/* ---------------- API CALLS ---------------- */

export const createOnboarding = async (data) => {
  const res = await API.post("/onboarding/create", data);
  return res.data;
};

export const getAllOnboardings = async () => {
  const res = await API.get("/onboarding");
  return res.data;
};

export const retryOnboarding = async (id) => {
  const res = await API.post("/onboarding/retry", { id });
  return res.data;
};