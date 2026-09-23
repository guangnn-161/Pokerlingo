import { z } from "zod";
export const permissionSchema = z.enum(["user", "admin"]);
export type Permission = z.infer<typeof permissionSchema>;
export const currentUserSchema = z.object({
  id: z.string(), email: z.string().email().nullable(), name: z.string().nullable(),
  image: z.string().url().nullable(), role: permissionSchema,
  profile: z.object({
    handle: z.string().nullable(), displayName: z.string().nullable(),
    visibility: z.enum(["private", "friends", "public"])
  }).nullable()
});
export type CurrentUser = z.infer<typeof currentUserSchema>;