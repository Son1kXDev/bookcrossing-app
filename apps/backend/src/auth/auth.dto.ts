import {z} from "zod";

export const RegisterDto = z.object({
    email: z.email(),
    password: z.string().min(6).max(72),
    displayName: z.string().min(2).max(32),
});

export const LoginDto = z.object({
    email: z.email(),
    password: z.string().min(6).max(72),
});
