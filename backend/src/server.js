import dotenv from "dotenv";
import Agenda from "./config/agendaConfig.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";
import mongoose from "mongoose";
import {
    markShutdownStarted,
    markStartupComplete,
    markStartupFailed,
} from "./utils/serviceState.js";

dotenv.config();
const port = process.env.PORT || 5000;
let server;

const shutdown = async (signal) => {
    console.log("Shutdown signal received",  signal );
    markShutdownStarted();

    try {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });

            console.log("HTTP server closed");
        }

        await Agenda.stop();
        console.log("Agenda scheduler stopped");

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close(false);
            console.log("MongoDB connection closed");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error during graceful shutdown", {
            signal,
            error: error.message,
            stack: error.stack,
        });
        process.exit(1);
    }
};

const startServer = async () => {
    try {
        console.log("Backend startup initiated", {
            port,
            nodeEnv: process.env.NODE_ENV || "development",
        });

        await connectDB();

        console.log("Starting Agenda scheduler");
        await Agenda.start();
        console.log("Agenda scheduler started");

        server = app.listen(port, () => {
            markStartupComplete();
            console.log("Server listening", { port });
        });
    } catch (error) {
        markStartupFailed();
        console.error("Backend startup failed", {
            error: error.message,
            stack: error.stack,
        });
        process.exit(1);
    }
};

process.on("SIGINT", () => {
    shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    shutdown("SIGTERM");
});

startServer();