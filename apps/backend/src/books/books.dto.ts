import {z} from "zod";

const BookCondition = z.enum(["like_new", "very_good", "good", "acceptable", "poor"]);

export const CreateBookDto = z.object({
    title: z.string().min(1).max(200),
    author: z.string().max(120).optional(),
    description: z.string().max(2000).optional(),

    isbn: z.string().trim().min(1).optional(),
    category: z.string().min(1).optional(),
    condition: BookCondition.nullable().optional(),
});

export const UpdateBookDto = z.object({
    title: z.string().min(1).max(200).optional(),
    author: z.string().max(120).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),

    isbn: z.string().trim().min(1).optional().nullable(),
    category: z.string().min(1).optional().nullable(),
    condition: BookCondition.nullable().optional(),
});
