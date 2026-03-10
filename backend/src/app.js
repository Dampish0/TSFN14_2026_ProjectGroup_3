import express from "express";
import { randomUUID } from "crypto";

// routes
import authRoutes from "./routes/authRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import refereeRoutes from "./routes/refereeRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import arenaRoutes from "./routes/arenaRoutes.js";
import seriesRoutes from "./routes/seriesRoutes.js";
import adminCaseRoutes from "./routes/adminCaseRoutes.js";

import cookieparser from "cookie-parser";
import cors from "cors";
import path from "path";
import { getHealthSnapshot, isReady, isStartupComplete } from "./utils/serviceState.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieparser());

app.use((req, res, next) => {
  const requestId = randomUUID();
  const startedAt = Date.now();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  console.log("Request received", {
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
  });

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    console.log("Request completed", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
    });
  });

  res.on("close", () => {
    if (!res.writableEnded) {
      console.log("Request closed before response finished", {
        requestId,
        method: req.method,
        path: req.originalUrl,
      });
    }
  });

  next();
});

app.use("/logos", express.static(path.join(process.cwd(), "public", "logos")));

app.use("/api/match", matchRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/referee", refereeRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/arena", arenaRoutes);
app.use("/api/series", seriesRoutes);
app.use("/api/admincase", adminCaseRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    ...getHealthSnapshot(),
  });
});

app.get("/health/live", (req, res) => {
  res.status(200).json({
    ok: true,
    status: "alive",
    ...getHealthSnapshot(),
  });
});

app.get("/health/ready", (req, res) => {
  if (!isReady()) {
    console.log("Readiness probe failed", {
      requestId: req.requestId,
      ...getHealthSnapshot(),
    });

    return res.status(503).json({
      ok: false,
      status: "not-ready",
      ...getHealthSnapshot(),
    });
  }

  return res.status(200).json({
    ok: true,
    status: "ready",
    ...getHealthSnapshot(),
  });
});

app.get("/health/startup", (req, res) => {
  if (!isStartupComplete()) {
    console.log("Startup probe failed", {
      requestId: req.requestId,
      ...getHealthSnapshot(),
    });

    return res.status(503).json({
      ok: false,
      status: "starting",
      ...getHealthSnapshot(),
    });
  }

  return res.status(200).json({
    ok: true,
    status: "started",
    ...getHealthSnapshot(),
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled application error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    error: err.message,
    stack: err.stack,
  });

  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status || 500).json({
    success: false,
    message: "Internal server error",
    requestId: req.requestId,
  });
});

const __dirname = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
  });
}

export default app;