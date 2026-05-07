import { auth } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function serverCompReqAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/sign-in");
  }

  if (!session.user.username) {
    return redirect("/onboarding");
  }

  return session;
}
