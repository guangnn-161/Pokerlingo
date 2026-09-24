import { getCurrentUser } from "@/lib/current-user";
import { fail, ok } from "@/lib/api";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(request, 401, "UNAUTHENTICATED", "Bạn cần đăng nhập.");
  return ok(request, user);
}
