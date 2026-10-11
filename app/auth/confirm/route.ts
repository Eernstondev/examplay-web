import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["signup", "email", "magiclink", "invite", "email_change"];

// Lien de confirmation par e-mail : fonctionne depuis n'importe quel navigateur ou appareil
// (contrairement au flux PKCE, qui exige le même navigateur que l'inscription).
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const url = request.nextUrl.clone();
  url.search = "";

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
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
