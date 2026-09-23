import { z } from "zod";
export const profileVisibilitySchema = z.enum(["private", "friends", "public"]);
export type ProfileVisibility = z.infer<typeof profileVisibilitySchema>;
export const leaderboardEntrySchema = z.object({ handle: z.string(), score: z.number(), rank: z.number().int().positive() });
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;