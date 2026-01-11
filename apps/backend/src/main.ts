import express from "express";
import cors from "cors";
import {env} from "./config/env.js";
import {authRouter} from "./auth/auth.routes.js";
import {walletRouter} from "./wallet/wallet.routes.js";
import {booksRouter} from "./books/books.routes.js";
import {makeDealsRouter} from "./deals/deals.routes.js";
import {buildShippingService} from "./di/shipping.js";
import {makeCdekRouter} from "./cdek/cdek.routes.js";
import path from "path";
import {fileURLToPath} from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");

app.use(
    cors(
        env.CORS_ORIGIN
            ? {origin: env.CORS_ORIGIN.split(",").map(s => s.trim()), credentials: true}
            : {origin: true, credentials: true}
    )
);

app.use(express.json());
app.get("/health", (_, res) => res.json({ok: true}));
app.use("/auth", authRouter);
app.use("/wallet", walletRouter);
app.use("/books", booksRouter);
const shipping = buildShippingService();
app.use("/deals", makeDealsRouter(shipping));
app.use("/cdek", makeCdekRouter(shipping));
app.use("/uploads", express.static(uploadsDir));

app.listen(env.PORT, () => console.log(`API on http://localhost:${env.PORT}`));
