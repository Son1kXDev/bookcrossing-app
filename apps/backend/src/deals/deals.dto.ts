import {z} from "zod";

export const CreateDealDto = z.object({
    bookId: z.union([z.string(), z.number()]),
});

export const SelectPickupDto = z.object({
    pickupPointId: z.string().min(2).max(64),
});

export const ShipDealDto = z.object({
    trackingNumber: z.string().min(3).max(64),
});
