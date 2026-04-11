import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/constants";

export default async function Home() {
  const jar = await cookies();
  if (jar.get(ACCESS_TOKEN_COOKIE_NAME)?.value) {
    redirect("/factures");
  }
  redirect("/login");
}
