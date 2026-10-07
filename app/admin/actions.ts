"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { parseQuestion } from "@/lib/question-parse";
import { ALL_SUBJECTS, DEPARTMENTS } from "@/lib/content";
import { AD_AUDIENCES, AD_PLACEMENTS, MEDIA_PREFIX, PARTNER_CATEGORIES, safeUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export type QuestionState = { error: string };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function saveQuestion(_prev: QuestionState, formData: FormData): Promise<QuestionState> {
  // Les règles RLS bloquent déjà tout non-admin ; ce contrôle donne un message clair.
  if (!(await isAdmin())) return { error: "Accès réservé aux administrateurs." };

  const parsed = parseQuestion(formData);
  if ("error" in parsed) return parsed;

  const id = text(formData, "id");
  const row = { subject_id: parsed.subject, ...parsed.fields, active: formData.get("active") === "on" };

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("questions").update(row).eq("id", id).select("id")
    : await supabase.from("questions").insert(row).select("id");

  if (error || !data?.length) {
    console.error("saveQuestion failed:", error?.code, error?.message);
    return { error: "La question n'a pas pu être enregistrée." };
  }

  revalidatePath("/admin/questions");
  redirect(`/admin/questions?subject=${parsed.subject}&type=${parsed.fields.type}`);
}

export async function setQuestionActive(formData: FormData) {
  if (!(await isAdmin())) return;
  const supabase = await createClient();
  await supabase
    .from("questions")
    .update({ active: formData.get("active") === "true" })
    .eq("id", text(formData, "id"));
  revalidatePath("/admin/questions");
}

export type FormState = { error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isMedia = (url: string) => url.startsWith(MEDIA_PREFIX);

// Lien optionnel : vide accepté, sinon http(s) uniquement.
function optionalUrl(formData: FormData, key: string): string | null | false {
  const value = text(formData, key);
  if (!value) return null;
  return safeUrl(value) ?? false;
}

export async function savePartner(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: "Accès réservé aux administrateurs." };

  const id = text(formData, "id");
  const category = text(formData, "category");
  const name = text(formData, "name");
  const description = text(formData, "description");
  const logo = text(formData, "logo_url");
  const links = {
    website: optionalUrl(formData, "website"),
    facebook: optionalUrl(formData, "facebook"),
    instagram: optionalUrl(formData, "instagram"),
    tiktok: optionalUrl(formData, "tiktok"),
  };

  if (!PARTNER_CATEGORIES.some((c) => c.id === category)) return { error: "Choisis une rubrique." };
  if (name.length < 2 || name.length > 120) return { error: "Indique le nom du partenaire." };
  if (description.length > 600) return { error: "Le texte dépasse 600 caractères." };
  if (logo && !isMedia(logo)) return { error: "Le logo doit être envoyé depuis ce formulaire." };
  if (Object.values(links).includes(false)) {
    return { error: "Un lien n'est pas valide : il doit commencer par https://" };
  }

  const row = {
    category,
    name,
    description: description || null,
    logo_url: logo || null,
    ...links,
    order_index: Math.trunc(Number(formData.get("order_index"))) || 0,
    active: formData.get("active") === "on",
  };

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("partners").update(row).eq("id", id).select("id")
    : await supabase.from("partners").insert(row).select("id");
  if (error || !data?.length) {
    console.error("savePartner failed:", error?.code, error?.message);
    return { error: "Le partenaire n'a pas pu être enregistré." };
  }

  revalidatePath("/collaborateurs");
  redirect("/admin/partenaires");
}

export async function deletePartner(formData: FormData) {
  if (!(await isAdmin())) return;
  const supabase = await createClient();
  await supabase.from("partners").delete().eq("id", text(formData, "id"));
  revalidatePath("/collaborateurs");
  revalidatePath("/admin/partenaires");
}

export async function saveAd(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: "Accès réservé aux administrateurs." };

  const id = text(formData, "id");
  const title = text(formData, "title");
  const image = text(formData, "image_url");
  const mediaType = text(formData, "media_type") === "video" ? "video" : "image";
  const link = optionalUrl(formData, "link_url");
  const placements = formData.getAll("placements").map(String);
  const departments = formData.getAll("departments").map(String);
  const audience = text(formData, "audience");
  const startsOn = text(formData, "starts_on");
  const endsOn = text(formData, "ends_on");

  if (title.length < 2 || title.length > 120) return { error: "Donne un titre à la publicité." };
  if (!isMedia(image)) return { error: "Ajoute l'image ou la vidéo de la publicité." };
  if (/\.(mp4|webm)$/.test(image) !== (mediaType === "video")) {
    return { error: "Le fichier ne correspond pas au type de média. Renvoie-le." };
  }
  if (link === false) return { error: "Le lien n'est pas valide : il doit commencer par https://" };
  if (!placements.length || placements.some((p) => !AD_PLACEMENTS.some((x) => x.id === p))) {
    return { error: "Choisis au moins un emplacement." };
  }
  if (departments.some((d) => !DEPARTMENTS.includes(d))) return { error: "Département inconnu." };
  if (!AD_AUDIENCES.some((a) => a.id === audience)) return { error: "Choisis un public." };
  if ((startsOn && !DATE_RE.test(startsOn)) || (endsOn && !DATE_RE.test(endsOn))) {
    return { error: "Une date n'est pas valide." };
  }
  if (startsOn && endsOn && endsOn < startsOn) {
    return { error: "La date de fin est avant la date de début." };
  }

  const row = {
    title,
    image_url: image,
    media_type: mediaType,
    link_url: link,
    placements,
    departments,
    audience,
    starts_on: startsOn || null,
    ends_on: endsOn || null,
    active: formData.get("active") === "on",
  };

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("ads").update(row).eq("id", id).select("id")
    : await supabase.from("ads").insert(row).select("id");
  if (error || !data?.length) {
    console.error("saveAd failed:", error?.code, error?.message);
    return { error: "La publicité n'a pas pu être enregistrée." };
  }

  revalidatePath("/");
  redirect("/admin/publicites");
}

export async function deleteAd(formData: FormData) {
  if (!(await isAdmin())) return;
  const supabase = await createClient();
  await supabase.from("ads").delete().eq("id", text(formData, "id"));
  revalidatePath("/");
  revalidatePath("/admin/publicites");
}

export async function addChapter(formData: FormData) {
  if (!(await isAdmin())) return;
  const subject = text(formData, "subject_id");
  const title = text(formData, "title");
  if (!ALL_SUBJECTS.some((s) => s.id === subject) || title.length < 2 || title.length > 120) return;

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("chapters")
    .select("order_index")
    .eq("subject_id", subject)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  await supabase
    .from("chapters")
    .insert({ subject_id: subject, title, order_index: (last?.order_index ?? 0) + 1 });
  revalidatePath("/admin/chapitres");
}

export async function updateChapter(formData: FormData) {
  if (!(await isAdmin())) return;
  const title = text(formData, "title");
  if (title.length < 2 || title.length > 120) return;
  const supabase = await createClient();
  await supabase
    .from("chapters")
    .update({ title, order_index: Math.trunc(Number(formData.get("order_index"))) || 0 })
    .eq("id", text(formData, "id"));
  revalidatePath("/admin/chapitres");
}

// Un chapitre qui contient encore des questions n'est pas supprimé.
export async function deleteChapter(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = text(formData, "id");
  const supabase = await createClient();
  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("chapter_id", id);
  if (count === 0) await supabase.from("chapters").delete().eq("id", id);
  revalidatePath("/admin/chapitres");
}

export async function setUserSuspended(formData: FormData) {
  if (!(await isAdmin())) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_suspended", {
    p_user: text(formData, "id"),
    p_suspended: formData.get("suspended") === "true",
  });
  if (error) console.error("admin_set_suspended failed:", error.code, error.message);
  revalidatePath("/admin/utilisateurs");
}

export async function setReportStatus(formData: FormData) {
  if (!(await isAdmin())) return;
  const status = text(formData, "status");
  if (!["open", "resolved", "rejected"].includes(status)) return;
  const supabase = await createClient();
  await supabase.from("question_reports").update({ status }).eq("id", text(formData, "id"));
  revalidatePath("/admin/signalements");
}

export async function reviewSubmission(formData: FormData) {
  if (!(await isAdmin())) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_review_submission", {
    p_id: text(formData, "id"),
    p_approve: formData.get("decision") === "approve",
    p_note: text(formData, "note"),
  });
  if (error) console.error("admin_review_submission failed:", error.code, error.message);
  revalidatePath("/admin/propositions");
}

export async function addContributor(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: "Accès réservé aux administrateurs." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_add_contributor", { p_email: text(formData, "email") });
  if (error) return { error: "L'ajout a échoué. Réessaie." };
  if (data !== true) {
    return { error: "Aucun compte Examplay avec cet e-mail. La personne doit d'abord créer son compte." };
  }
  revalidatePath("/admin/contributeurs");
  return { error: "" };
}

export async function removeContributor(formData: FormData) {
  if (!(await isAdmin())) return;
  const supabase = await createClient();
  await supabase.rpc("admin_remove_contributor", { p_user: text(formData, "id") });
  revalidatePath("/admin/contributeurs");
}

// Approuve une proposition avec la version retouchée par l'admin.
export async function approveEditedSubmission(_prev: QuestionState, formData: FormData): Promise<QuestionState> {
  if (!(await isAdmin())) return { error: "Accès réservé aux administrateurs." };

  const parsed = parseQuestion(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_review_submission", {
    p_id: text(formData, "submission_id"),
    p_approve: true,
    p_note: text(formData, "note"),
    p_payload: parsed.fields,
  });
  if (error) {
    console.error("approveEditedSubmission failed:", error.code, error.message);
    return { error: "La proposition n'a pas pu être publiée (déjà traitée ?)." };
  }

  revalidatePath("/admin/propositions");
  redirect("/admin/propositions");
}

export async function reviewApplication(formData: FormData) {
  if (!(await isAdmin())) return;
  const supabase = await createClient();
  await supabase.rpc("admin_review_application", {
    p_user: text(formData, "id"),
    p_approve: formData.get("decision") === "approve",
  });
  revalidatePath("/admin/contributeurs");
}
