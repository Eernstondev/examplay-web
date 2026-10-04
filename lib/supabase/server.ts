import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client lié à la session de l'utilisateur (cookies). À utiliser côté serveur uniquement.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appel depuis un Server Component : l'écriture est faite par proxy.ts.
          }
        },
      },
    },
  );
}
