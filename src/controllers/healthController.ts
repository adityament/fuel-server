import { Request, Response } from "express";
import mongoose from "mongoose";

const DB_STATES: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

/**
 * ✅ HEALTH CHECK (PUBLIC)
 *
 * Deliberately unauthenticated — uptime monitors and load balancers have no
 * token. Returns 503 when Mongo is down so a monitor can act on the status
 * code alone, without parsing the body.
 */
export const getHealth = (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbConnected = dbState === 1;

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "ok" : "degraded",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: DB_STATES[dbState] ?? "unknown",
  });
};
