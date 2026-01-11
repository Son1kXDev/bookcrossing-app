import {Router} from "express";
import bcrypt from "bcrypt";
import {prisma} from "../db/prisma.js";
import {LoginDto, RegisterDto} from "./auth.dto.js";
import {signAccessToken} from "./jwt.js";
import {AuthedRequest, authGuard} from "./auth-middleware.js";
import {ChangePasswordDto, DeleteAccountDto} from "../users/users.dto.js";
import path from "path";
import {fileURLToPath} from "url";
import {promises as fs} from "fs";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
    const parsed = RegisterDto.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({error: "VALIDATION_ERROR", details: parsed.error.flatten()});

    const {email, password, displayName} = parsed.data;

    const existing = await prisma.user.findUnique({where: {email}});
    if (existing) return res.status(409).json({error: "EMAIL_ALREADY_USED"});

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            displayName,
            wallet: {create: {balance: 1}},
        },
        select: {id: true, email: true, displayName: true, role: true, createdAt: true},
    });

    const token = signAccessToken(user.id);

    return res.status(201).json({
        token,
        user: {
            id: user.id.toString(),
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            createdAt: user.createdAt,
        },
    });
});

authRouter.post("/login", async (req, res) => {
    const parsed = LoginDto.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({error: "VALIDATION_ERROR", details: parsed.error.flatten()});

    const {email, password} = parsed.data;

    const user = await prisma.user.findUnique({where: {email}});
    if (!user) return res.status(401).json({error: "INVALID_CREDENTIALS"});

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({error: "INVALID_CREDENTIALS"});

    const token = signAccessToken(user.id);

    return res.json({
        token,
        user: {
            id: user.id.toString(),
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            createdAt: user.createdAt,
        },
    });
});

authRouter.get("/me", authGuard, async (req, res) => {
    const userId = (req as AuthedRequest).userId;

    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            wallet: {select: {balance: true, updatedAt: true}},
        },
    });

    if (!user) return res.status(404).json({error: "NOT_FOUND"});

    return res.json({
        id: user.id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
        wallet: user.wallet
            ? {balance: user.wallet.balance, updatedAt: user.wallet.updatedAt}
            : null,
    });
});

authRouter.post("/change-password", authGuard, async (req, res) => {
    const userId = (req as AuthedRequest).userId;

    const parsed = ChangePasswordDto.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: "VALIDATION_ERROR", details: parsed.error.flatten()});
    }

    const {currentPassword, newPassword} = parsed.data;

    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {id: true, passwordHash: true},
    });
    if (!user) return res.status(404).json({error: "NOT_FOUND"});

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({error: "INVALID_CREDENTIALS"});

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: {id: userId},
        data: {passwordHash: newHash},
    });

    return res.json({ok: true});
});

authRouter.delete("/me", authGuard, async (req, res) => {
    const userId = (req as AuthedRequest).userId;

    const parsed = DeleteAccountDto.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: "VALIDATION_ERROR", details: parsed.error.flatten()});
    }

    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {id: true, passwordHash: true, avatarUrl: true},
    });
    if (!user) return res.status(404).json({error: "NOT_FOUND"});

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) return res.status(401).json({error: "INVALID_CREDENTIALS"});

    if (user.avatarUrl?.startsWith("/uploads/")) {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const uploadsDir = path.join(__dirname, "..", "..", "uploads");

        const name = user.avatarUrl.replace("/uploads/", "");
        const fullPath = path.join(uploadsDir, name);
        await fs.unlink(fullPath).catch(() => {
        });
    }

    await prisma.user.delete({where: {id: userId}});

    return res.json({ok: true});
});
 
