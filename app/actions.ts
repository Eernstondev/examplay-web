"use server";

import { contactSubjects } from "@/lib/contact";
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

export type ContactState = {
  status: "idle" | "success" | "error";
  message: string;
  values: { name: string; email: string; subject: string; message: string };
};

export async function sendContactRequest(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    subject: String(formData.get("subject") ?? ""),
    message: String(formData.get("message") ?? "").trim(),
  };
  const success: ContactState = {
    status: "success",
    message: "Demande envoyée. Notre équipe vous répond sous 48 h.",
    values,
  };
  const fail = (message: string): ContactState => ({ status: "error", message, values });

  if (formData.get("website")) return success;

  if (values.name.length < 2 || values.name.length > 120) {
    return fail("Indiquez votre nom ou celui de votre organisation.");
  }
  if (values.email.length > 254 || !EMAIL_RE.test(values.email)) {
    return fail("Cette adresse e-mail n'est pas valide.");
  }
  if (!contactSubjects.some((s) => s.value === values.subject)) {
    return fail("Sélectionnez un sujet.");
  }
  if (values.message.length < 10 || values.message.length > 4000) {
    return fail("Le message doit contenir entre 10 et 4000 caractères.");
  }

  const { error } = await createSupabaseClient().from("contact_requests").insert(values);

  if (error) {
    console.error("contact insert failed:", error.code, error.message);
    return fail("La demande n'a pas pu être envoyée. Réessayez dans un instant.");
  }

  return success;
}
