import {z} from "zod";

export const PvzQueryDto = z.object({
    city: z.string().min(1).optional(),
    type: z.enum(["PVZ", "POSTAMAT"]).optional(),
    countryCode: z.string().min(2).max(2).optional(),
});
