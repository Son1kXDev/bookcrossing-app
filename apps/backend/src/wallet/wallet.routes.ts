import {Router} from "express";
import {prisma} from "../db/prisma.js";
import {type AuthedRequest, authGuard} from "../auth/auth-middleware.js";

export const walletRouter = Router();

walletRouter.get("/", authGuard, async (req, res) => {
    const userId = (req as AuthedRequest).userId;

    const wallet = await prisma.wallet.findUnique({
        where: {userId},
        select: {balance: true, updatedAt: true},
    });

    if (!wallet) return res.status(404).json({error: "WALLET_NOT_FOUND"});

    return res.json(wallet);
});
