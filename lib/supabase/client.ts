import { createBrowserClient } from "@supabase/ssr";

// Client navigateur : partage la session (cookies) avec le serveur.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
