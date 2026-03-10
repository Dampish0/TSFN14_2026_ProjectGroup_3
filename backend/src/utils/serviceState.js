import mongoose from "mongoose";

const isTestEnvironment = process.env.NODE_ENV === "test";

const serviceState = {
  startedAt: new Date().toISOString(),
  startupComplete: isTestEnvironment,
  startupFailed: false,
  shuttingDown: false,
};

export const markStartupComplete = () => {
  serviceState.startupComplete = true;
  serviceState.startupFailed = false;
};

export const markStartupFailed = () => {
  serviceState.startupFailed = true;
};

export const markShutdownStarted = () => {
  serviceState.shuttingDown = true;
};

export const isDatabaseConnected = () => {
  if (isTestEnvironment) {
    return true;
  }

  return mongoose.connection.readyState === 1;
};

export const isStartupComplete = () => {
  if (isTestEnvironment) {
    return true;
  }

  return serviceState.startupComplete && !serviceState.startupFailed;
};

export const isReady = () => isStartupComplete() && isDatabaseConnected() && !serviceState.shuttingDown;

export const getHealthSnapshot = () => ({
  alive: true,
  ready: isReady(),
  startupComplete: isStartupComplete(),
  databaseConnected: isDatabaseConnected(),
  databaseState: mongoose.connection.readyState,
  shuttingDown: serviceState.shuttingDown,
  startedAt: serviceState.startedAt,
});