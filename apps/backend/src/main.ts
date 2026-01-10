import express from "express";
import cors from "cors";

const app = express();
app.use(cors({origin: true, credentials: true}));
app.use(express.json());

app.get("/health", (_, res) => res.json({ok: true}));

app.listen(3000, () => console.log("API on http://localhost:3000"));
