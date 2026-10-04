import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Arrivée depuis le lien de confirmation envoyé par e-mail.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const url = request.nextUrl.clone();
  url.search = "";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  url.pathname = "/connexion";
  url.searchParams.set("erreur", "lien");
  return NextResponse.redirect(url);
}
