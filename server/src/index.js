import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import ruleRoutes from "./routes/ruleRoutes.js";
import integrationRoutes from "./routes/integrationRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "NotifyAI API is running" }),
);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/rules", ruleRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/settings", settingsRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res
    .status(error.status || 500)
    .json({ message: error.message || "Internal server error" });
});

const port = process.env.PORT || 5000;
try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET must be set to a secret of at least 32 characters",
    );
  }
  await connectDB();
  app.listen(port, () =>
    console.log(`NotifyAI API listening on http://localhost:${port}`),
  );
} catch (error) {
  console.error("Could not start server:", error.message);
  process.exit(1);
}
