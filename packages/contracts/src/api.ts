import { z } from "zod";
export const apiErrorSchema = z.object({
  code: z.string(), message: z.string(), requestId: z.string(),
  details: z.record(z.string(), z.unknown()).optional()
});
export type ApiError = z.infer<typeof apiErrorSchema>;
export const apiSuccessSchema = <T extends z.ZodTypeAny>(data: T) => z.object({ data, requestId: z.string() });
export const profileUpdateSchema = z.object({
  handle: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,24}$/, "Use 3–24 lowercase letters, digits or underscores.").optional(),
  displayName: z.string().trim().min(1).max(60).optional(),
  visibility: z.enum(["private", "friends", "public"]).optional(),
  timezone: z.string().trim().min(1).max(64).optional()
}).refine((value) => Object.keys(value).length > 0, "Provide at least one field.");
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;