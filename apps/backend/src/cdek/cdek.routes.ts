import {Router} from "express";
import {PvzQueryDto} from "./cdek.dto.js";
import type {ShippingService} from "../shipping/shipping.service.js";

export function makeCdekRouter(shipping: ShippingService) {
    const router = Router();

    router.get("/provider", (_req, res) => {
        return res.json({code: shipping.getProviderCode()});
    });

    router.get("/pvz", async (req, res) => {
        const parsed = PvzQueryDto.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({error: "VALIDATION_ERROR", details: parsed.error.flatten()});
        }

        try {
            const points = await shipping.getPickupPoints(parsed.data);
            return res.json(points);
        } catch (e) {
            console.error(e);
            return res.status(502).json({error: "CDEK_UNAVAILABLE"});
        }
    });

    router.get("/pvz/:code", async (req, res) => {
        const code = String(req.params.code ?? "");
        if (!code) return res.status(400).json({error: "INVALID_PVZ_CODE"});

        const pvz = await shipping.getPickupPointByCode(code);
        if (!pvz) return res.status(404).json({error: "PVZ_NOT_FOUND"});
        return res.json(pvz);
    });

    router.get("/track/:trackingNumber", async (req, res) => {
        const trackingNumber = String(req.params.trackingNumber ?? "");
        if (!trackingNumber) return res.status(400).json({error: "INVALID_TRACKING_NUMBER"});

        try {
            const info = await shipping.track(trackingNumber);
            return res.json(info);
        } catch (e) {
            console.error(e);
            return res.status(502).json({error: "CDEK_UNAVAILABLE"});
        }
    });

    return router;
}
