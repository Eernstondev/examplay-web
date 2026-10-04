"use server";

import { createSupabaseClient } from "@/lib/supabase";

export type WaitlistState = {
  status: "idle" | "success" | "error";
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const success: WaitlistState = {
    status: "success",
    message: "C'est noté. On t'écrit dès que l'app est disponible.",
  };

  // Champ piège : rempli uniquement par les robots.
  if (formData.get("website")) return success;

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return {
      status: "error",
      message: "Cette adresse e-mail n'est pas valide. Vérifie-la et réessaie.",
    };
  }

  const { error } = await createSupabaseClient()
    .from("waitlist")
    .insert({ email });

  // 23505 = e-mail déjà inscrit : même réponse, sans révéler l'inscription.
  if (error && error.code !== "23505") {
    console.error("waitlist insert failed:", error.code, error.message);
    return {
      status: "error",
      message: "L'inscription n'a pas pu être enregistrée. Réessaie dans un instant.",
    };
  }

  return success;
}
