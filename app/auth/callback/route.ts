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
      // Code de parrainage saisi à l'inscription : on l'applique une fois le compte confirmé.
      const { data: userData } = await supabase.auth.getUser();
      const referral = userData.user?.user_metadata?.referral_code;
      if (typeof referral === "string" && referral) {
        await supabase.rpc("apply_referral", { p_code: referral }).then(undefined, () => undefined);
      }
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  url.pathname = "/connexion";
  url.searchParams.set("erreur", "lien");
  return NextResponse.redirect(url);
}
