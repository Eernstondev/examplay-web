"use server";

import { redirect } from "next/navigation";
import type { QuestionState } from "@/app/admin/actions";
import { isContributor } from "@/lib/admin";
import { parseQuestion } from "@/lib/question-parse";
import { createClient } from "@/lib/supabase/server";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const DENIED = "Cet espace est réservé aux contributeurs approuvés.";
const FAILED = "La proposition n'a pas pu être envoyée. Réessaie dans un instant.";

// Nouvelle question ou correction d'une question existante (si question_id est fourni).
// Rien n'est publié : la proposition attend la validation d'un admin.
export async function submitQuestion(_prev: QuestionState, formData: FormData): Promise<QuestionState> {
  if (!(await isContributor())) return { error: DENIED };

  const parsed = parseQuestion(formData);
  if ("error" in parsed) return parsed;

  const questionId = text(formData, "question_id");
  const supabase = await createClient();
  const { error } = await supabase.from("submissions").insert({
    kind: questionId ? "correction" : "question",
    subject_id: parsed.subject,
    question_id: questionId || null,
    payload: parsed.fields,
    note: text(formData, "note") || null,
  });
  if (error) {
    console.error("submitQuestion failed:", error.code, error.message);
    return { error: FAILED };
  }
  redirect("/contribuer?envoi=ok");
}

export async function withdrawSubmission(formData: FormData) {
  const supabase = await createClient();
  // La règle RLS n'autorise que le retrait de ses propres propositions en attente.
  await supabase.from("submissions").delete().eq("id", text(formData, "id"));
  redirect("/contribuer");
}

export async function applyAsContributor(_prev: QuestionState, formData: FormData): Promise<QuestionState> {
  const subjects = text(formData, "subjects");
  const school = text(formData, "school");
  const message = text(formData, "message");
  if (subjects.length < 2 || subjects.length > 200) return { error: "Indique la ou les matières que tu enseignes." };
  if (school.length < 2 || school.length > 200) return { error: "Indique ton établissement ou ton organisation." };
  if (message.length > 1000) return { error: "La présentation dépasse 1000 caractères." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("contributor_applications")
    .insert({ subjects, school, message: message || null });
  // 23505 : une demande existe déjà pour ce compte.
  if (error && error.code !== "23505") {
    console.error("applyAsContributor failed:", error.code, error.message);
    return { error: "La demande n'a pas pu être envoyée. Réessaie dans un instant." };
  }
  redirect("/contribuer");
}
