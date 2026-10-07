import { NextResponse, type NextRequest } from "next/server";
import { safeUrl } from "@/lib/media";
import { createPublicClient } from "@/lib/supabase/public";

// Compte le clic puis redirige vers le lien de la publicité.
export async function GET(request: NextRequest, { params }: RouteContext<"/pub/[id]">) {
  const { id } = await params;
  const home = new URL("/", request.url);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(home);

  const { data } = await createPublicClient().rpc("ad_click", { p_id: id });
  const target = typeof data === "string" ? safeUrl(data) : null;
  return NextResponse.redirect(target ?? home);
}
