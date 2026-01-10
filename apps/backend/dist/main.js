import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { authRouter } from "./auth/auth.routes.js";
const app = express();
app.use(cors(env.CORS_ORIGIN
    ? { origin: env.CORS_ORIGIN.split(",").map(s => s.trim()), credentials: true }
    : { origin: true, credentials: true }));
app.use(express.json());
app.get("/health", (_, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.listen(env.PORT, () => console.log(`API on http://localhost:${env.PORT}`));
