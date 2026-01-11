import {z} from "zod";

export const UpdateMeDto = z.object({
    displayName: z.string().trim().min(2).max(50).optional(),
});

export const ChangePasswordDto = z.object({
    currentPassword: z.string().min(6).max(200),
    newPassword: z.string().min(6).max(200),
});

export const DeleteAccountDto = z.object({
    password: z.string().min(6).max(200),
});
