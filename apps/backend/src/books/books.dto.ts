import {z} from "zod";

export const CreateBookDto = z.object({
    title: z.string().min(1).max(200),
    author: z.string().max(120).optional(),
    description: z.string().max(2000).optional(),
});
