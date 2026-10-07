// Vérification anti-robots Cloudflare Turnstile, côté serveur.
// Sans clé secrète configurée, le contrôle est désactivé (développement local).
export async function verifyTurnstile(formData: FormData): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  const token = formData.get("cf-turnstile-response");
  if (typeof token !== "string" || !token) return false;

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

export const TURNSTILE_ERROR = "La vérification anti-robots a échoué. Réessaie.";
