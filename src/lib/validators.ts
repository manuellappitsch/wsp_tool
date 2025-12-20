import { z } from "zod";

export const contentSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    type: z.enum(["VIDEO", "PDF"]),
    url: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    isPremium: z.boolean().default(false),
    isActive: z.boolean().default(true),
});

export const bookingSchema = z.object({
    timeslotId: z.string(),
    notes: z.string().optional(),
});
