import { createClient } from "@supabase/supabase-js";

// Client sans session, pour les données publiques des pages mises en cache
// (partenaires, publicités de l'accueil).
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
