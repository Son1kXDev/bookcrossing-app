import {Router} from "express";
import {prisma} from "../db/prisma.js";
import {type AuthedRequest, authGuard} from "../auth/auth-middleware.js";
import {CreateDealDto, SelectPickupDto, ShipDealDto} from "./deals.dto.js";
import type {ShippingService} from "../shipping/shipping.service.js";
import {getParamId, toBigInt} from "../core/utilities.js";

export const dealsRouter = Router();

export function makeDealsRouter(shipping: ShippingService) {
    const dealsRouter = Router();

    function mapDeal(d: any) {
        return {
            ...d,
            id: d.id.toString(),
            bookId: d.bookId?.toString?.() ?? d.bookId,
            buyerId: d.buyerId?.toString?.() ?? d.buyerId,
            sellerId: d.sellerId?.toString?.() ?? d.sellerId,
            book: d.book ? {...d.book, id: d.book.id.toString()} : undefined,
            buyer: d.buyer ? {...d.buyer, id: d.buyer.id.toString()} : undefined,
            seller: d.seller ? {...d.seller, id: d.seller.id.toString()} : undefined,
        };
    }

    dealsRouter.post("/", authGuard, async (req, res) => {
        const parsed = CreateDealDto.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({error: "VALIDATION_ERROR", details: parsed.error.flatten()});

        const buyerId = (req as AuthedRequest).userId;

        let bookId: bigint;
        try {
            bookId = toBigInt(parsed.data.bookId);
        } catch {
            return res.status(400).json({error: "INVALID_BOOK_ID"});
        }

        try {
            const out = await prisma.$transaction(async tx => {
                const book = await tx.book.findUnique({
                    where: {id: bookId},
                    select: {id: true, ownerId: true, status: true},
                });
                if (!book) return {error: "BOOK_NOT_FOUND" as const};
                if (book.ownerId === buyerId) return {error: "CANNOT_DEAL_OWN_BOOK" as const};
                if (book.status !== "available") return {error: "BOOK_NOT_AVAILABLE" as const};

                const exists = await tx.deal.findFirst({
                    where: {
                        bookId,
                        status: {in: ["pending", "accepted", "pickup_selected", "shipped"]},
                    },
                    select: {id: true},
                });
                if (exists) return {error: "DEAL_ALREADY_EXISTS" as const};

                const deal = await tx.deal.create({
                    data: {bookId, sellerId: book.ownerId, buyerId, status: "pending"},
                    select: {id: true, status: true, createdAt: true, bookId: true, buyerId: true, sellerId: true},
                });

                await tx.book.update({where: {id: bookId}, data: {status: "reserved"}});

                return {ok: true as const, deal};
            });

            if (!out.ok) return res.status(409).json({error: out.error});
            return res.status(201).json(mapDeal(out.deal));
        } catch (e) {
            console.error(e);
            return res.status(500).json({error: "INTERNAL_ERROR"});
        }
    });

    dealsRouter.get("/my", authGuard, async (req, res) => {
        const buyerId = (req as AuthedRequest).userId;

        const deals = await prisma.deal.findMany({
            where: {buyerId},
            orderBy: {createdAt: "desc"},
            select: {
                id: true, status: true, createdAt: true, acceptedAt: true, pickupPointId: true,
                trackingNumber: true, sellerShippedAt: true, buyerReceivedAt: true,
                book: {select: {id: true, title: true}},
                seller: {select: {id: true, displayName: true}},
            },
        });

        return res.json(deals.map(mapDeal));
    });

    dealsRouter.get("/user/:id", async (req, res) => {
        const idStr = getParamId(req, "id");
        if (!idStr) return res.status(400).json({error: "INVALID_USER_ID"});

        let userId: bigint;
        try {
            userId = toBigInt(idStr);
        } catch {
            return res.status(400).json({error: "INVALID_USER_ID"});
        }


        const deals = await prisma.deal.findMany({
            where: {
                OR: [
                    {buyerId: userId},
                    {sellerId: userId},
                ],
            },
            orderBy: {createdAt: "desc"},
            select: {
                id: true, status: true, createdAt: true, acceptedAt: true, pickupPointId: true,
                trackingNumber: true, sellerShippedAt: true, buyerReceivedAt: true,
                book: {select: {id: true, title: true}},
                buyer: {select: {id: true, displayName: true}},
                seller: {select: {id: true, displayName: true}},
            },
        });

        return res.json(deals.map(mapDeal));
    });

    dealsRouter.get("/incoming", authGuard, async (req, res) => {
        const sellerId = (req as AuthedRequest).userId;

        const deals = await prisma.deal.findMany({
            where: {sellerId},
            orderBy: {createdAt: "desc"},
            select: {
                id: true, status: true, createdAt: true, acceptedAt: true, pickupPointId: true,
                trackingNumber: true, sellerShippedAt: true, buyerReceivedAt: true,
                book: {select: {id: true, title: true}},
                buyer: {select: {id: true, displayName: true}},
            },
        });

        return res.json(deals.map(mapDeal));
    });

    dealsRouter.post("/:id/accept", authGuard, async (req, res) => {
        const sellerId = (req as AuthedRequest).userId;

        const idStr = getParamId(req, "id");
        if (!idStr) return res.status(400).json({error: "INVALID_DEAL_ID"});

        let dealId: bigint;
        try {
            dealId = toBigInt(idStr);
        } catch {
            return res.status(400).json({error: "INVALID_DEAL_ID"});
        }

        try {
            const out = await prisma.$transaction(async tx => {
                const deal = await tx.deal.findUnique({
                    where: {id: dealId},
                    select: {id: true, status: true, sellerId: true, buyerId: true, bookId: true},
                });
                if (!deal) return {error: "DEAL_NOT_FOUND" as const};
                if (deal.sellerId !== sellerId) return {error: "FORBIDDEN" as const};
                if (deal.status !== "pending") return {error: "DEAL_NOT_PENDING" as const};

                const book = await tx.book.findUnique({
                    where: {id: deal.bookId},
                    select: {ownerId: true, status: true},
                });
                if (!book) return {error: "BOOK_NOT_FOUND" as const};
                if (book.ownerId !== sellerId) return {error: "NOT_OWNER" as const};
                if (book.status !== "reserved") return {error: "BOOK_NOT_RESERVED" as const};

                const buyerWallet = await tx.wallet.findUnique({
                    where: {userId: deal.buyerId},
                    select: {balance: true},
                });
                if (!buyerWallet) return {error: "BUYER_WALLET_NOT_FOUND" as const};
                if (buyerWallet.balance < 1) return {error: "INSUFFICIENT_FUNDS" as const};

                await tx.wallet.update({
                    where: {userId: deal.buyerId},
                    data: {balance: {decrement: 1}},
                });

                const updated = await tx.deal.update({
                    where: {id: dealId},
                    data: {status: "accepted", acceptedAt: new Date()},
                    select: {id: true, status: true, acceptedAt: true},
                });

                return {ok: true as const, updated};
            });

            if (!out.ok) return res.status(409).json({error: out.error});
            return res.json(mapDeal(out.updated));
        } catch (e) {
            console.error(e);
            return res.status(500).json({error: "INTERNAL_ERROR"});
        }
    });

    dealsRouter.post("/:id/receive", authGuard, async (req, res) => {
        const buyerId = (req as AuthedRequest).userId;

        const idStr = getParamId(req, "id");
        if (!idStr) return res.status(400).json({error: "INVALID_DEAL_ID"});

        let dealId: bigint;
        try {
            dealId = toBigInt(idStr);
        } catch {
            return res.status(400).json({error: "INVALID_DEAL_ID"});
        }

        try {
            const out = await prisma.$transaction(async tx => {
                const deal = await tx.deal.findUnique({
                    where: {id: dealId},
                    select: {id: true, status: true, buyerId: true, sellerId: true, bookId: true},
                });
                if (!deal) return {error: "DEAL_NOT_FOUND" as const};
                if (deal.buyerId !== buyerId) return {error: "FORBIDDEN" as const};
                if (deal.status !== "shipped") return {error: "DEAL_NOT_SHIPPED" as const};

                await tx.wallet.update({
                    where: {userId: deal.sellerId},
                    data: {balance: {increment: 1}},
                });

                await tx.deal.update({
                    where: {id: dealId},
                    data: {status: "completed", buyerReceivedAt: new Date()},
                });

                await tx.book.update({
                    where: {id: deal.bookId},
                    data: {ownerId: deal.buyerId, status: "exchanged"},
                });

                return {ok: true as const};
            });

            if (!out.ok) return res.status(409).json({error: out.error});
            return res.json({ok: true});
        } catch (e) {
            console.error(e);
            return res.status(500).json({error: "INTERNAL_ERROR"});
        }
    });

    dealsRouter.post("/:id/reject", authGuard, async (req, res) => {
        const sellerId = (req as AuthedRequest).userId;

        const idStr = getParamId(req, "id");
        if (!idStr) return res.status(400).json({error: "INVALID_DEAL_ID"});

        let dealId: bigint;
        try {
            dealId = toBigInt(idStr);
        } catch {
            return res.status(400).json({error: "INVALID_DEAL_ID"});
        }

        const deal = await prisma.deal.findUnique({
            where: {id: dealId},
            select: {sellerId: true, status: true, bookId: true},
        });
        if (!deal) return res.status(404).json({error: "DEAL_NOT_FOUND"});
        if (deal.sellerId !== sellerId) return res.status(403).json({error: "FORBIDDEN"});
        if (deal.status !== "pending") return res.status(409).json({error: "DEAL_NOT_PENDING"});

        await prisma.$transaction(async tx => {
            await tx.deal.update({where: {id: dealId}, data: {status: "rejected"}});
            await tx.book.update({where: {id: deal.bookId}, data: {status: "available"}});
        });

        return res.json({ok: true});
    });

    dealsRouter.post("/:id/cancel", authGuard, async (req, res) => {
        const buyerId = (req as AuthedRequest).userId;

        const idStr = getParamId(req, "id");
        if (!idStr) return res.status(400).json({error: "INVALID_DEAL_ID"});

        let dealId: bigint;
        try {
            dealId = toBigInt(idStr);
        } catch {
            return res.status(400).json({error: "INVALID_DEAL_ID"});
        }

        const deal = await prisma.deal.findUnique({
            where: {id: dealId},
            select: {buyerId: true, status: true, bookId: true},
        });
        if (!deal) return res.status(404).json({error: "DEAL_NOT_FOUND"});
        if (deal.buyerId !== buyerId) return res.status(403).json({error: "FORBIDDEN"});
        if (deal.status !== "pending") return res.status(409).json({error: "DEAL_NOT_PENDING"});

        await prisma.$transaction(async tx => {
            await tx.deal.update({where: {id: dealId}, data: {status: "cancelled"}});
            await tx.book.update({where: {id: deal.bookId}, data: {status: "available"}});
        });

        return res.json({ok: true});
    });

    dealsRouter.post("/:id/pickup", authGuard, async (req, res) => {
        const buyerId = (req as AuthedRequest).userId;

        const idStr = getParamId(req, "id");
        if (!idStr) return res.status(400).json({error: "INVALID_DEAL_ID"});

        let dealId: bigint;
        try {
            dealId = toBigInt(idStr);
        } catch {
            return res.status(400).json({error: "INVALID_DEAL_ID"});
        }

        const parsed = SelectPickupDto.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({error: "VALIDATION_ERROR", details: parsed.error.flatten()});

        const {pickupPointId} = parsed.data;

        const pvz = await shipping.getPickupPointByCode(pickupPointId);
        if (!pvz) return res.status(404).json({error: "PVZ_NOT_FOUND"});

        const deal = await prisma.deal.findUnique({
            where: {id: dealId},
            select: {buyerId: true, status: true},
        });
        if (!deal) return res.status(404).json({error: "DEAL_NOT_FOUND"});
        if (deal.buyerId !== buyerId) return res.status(403).json({error: "FORBIDDEN"});
        if (deal.status !== "accepted") return res.status(409).json({error: "DEAL_NOT_ACCEPTED"});

        const updated = await prisma.deal.update({
            where: {id: dealId},
            data: {status: "pickup_selected", pickupPointId},
            select: {id: true, status: true, pickupPointId: true},
        });

        return res.json(mapDeal(updated));
    });

    dealsRouter.post("/:id/ship", authGuard, async (req, res) => {
        const sellerId = (req as AuthedRequest).userId;

        const idStr = getParamId(req, "id");
        if (!idStr) return res.status(400).json({error: "INVALID_DEAL_ID"});

        let dealId: bigint;
        try {
            dealId = toBigInt(idStr);
        } catch {
            return res.status(400).json({error: "INVALID_DEAL_ID"});
        }

        const parsed = ShipDealDto.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({error: "VALIDATION_ERROR", details: parsed.error.flatten()});

        const deal = await prisma.deal.findUnique({
            where: {id: dealId},
            select: {sellerId: true, status: true, pickupPointId: true, trackingNumber: true},
        });
        if (!deal) return res.status(404).json({error: "DEAL_NOT_FOUND"});
        if (deal.sellerId !== sellerId) return res.status(403).json({error: "FORBIDDEN"});
        if (deal.status !== "pickup_selected") return res.status(409).json({error: "DEAL_PICKUP_NOT_SELECTED"});
        if (!deal.pickupPointId) return res.status(409).json({error: "PICKUP_POINT_REQUIRED"});

        const trackingNumber = (parsed.data.trackingNumber?.trim() || deal.trackingNumber || makeMockTracking());

        const updated = await prisma.deal.update({
            where: {id: dealId},
            data: {status: "shipped", trackingNumber, sellerShippedAt: new Date()},
            select: {id: true, status: true, trackingNumber: true, sellerShippedAt: true},
        });

        return res.json(mapDeal(updated));
    });

    return dealsRouter;
}

function makeMockTracking() {
    return `MOCK${Date.now().toString().slice(-8)}`;
}
