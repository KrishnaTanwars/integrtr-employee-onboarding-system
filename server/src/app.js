import express from "express";
//import onboardingRoutes from "./routes/onboarding.routes.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend Running ");
});

// app.use("/api/onboarding", onboardingRoutes);

export default app;