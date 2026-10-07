"use server";

import { revalidatePath } from "next/cache";
import { getSubjects } from "@/lib/content";
import { getAccount } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type EnrollState = { error: string; done: boolean };

// Codes levés par la fonction SQL request_course_enrollment.
const MESSAGES: Record<string, string> = {
  not_for_sale: "Cette matière est gratuite : pas besoin de t'inscrire.",
  invalid_name: "Indique ton nom complet (3 caractères minimum).",
  invalid_phone: "Numéro de téléphone invalide. Exemple : 38 00 00 00 ou +509 38 00 00 00.",
  invalid_ref: "Indique l'identifiant de la transaction (4 à 40 caractères).",
  already_enrolled: "Tu as déjà une inscription en cours ou confirmée pour cette matière.",
};

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function requestEnrollment(_prev: EnrollState, formData: FormData): Promise<EnrollState> {
  const account = await getAccount();
  if (!account) return { error: "Reconnecte-toi pour t'inscrire.", done: false };

  const subject = text(formData, "subject");
  if (!getSubjects(account.level).some((s) => s.id === subject)) {
    return { error: "Matière inconnue.", done: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_course_enrollment", {
    p_subject: subject,
    p_name: text(formData, "full_name"),
    p_phone: text(formData, "phone"),
    p_ref: text(formData, "payment_ref"),
  });

  if (error) {
    const known = Object.keys(MESSAGES).find((code) => error.message.includes(code));
    if (!known) console.error("requestEnrollment failed:", error.code, error.message);
    return { error: known ? MESSAGES[known] : "L'inscription a échoué. Réessaie dans un instant.", done: false };
  }

  revalidatePath("/dashboard/cours");
  return { error: "", done: true };
}
