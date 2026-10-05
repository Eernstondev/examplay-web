"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { contactSubjects } from "@/lib/contact";
import { departments, findLevel } from "@/lib/levels";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type AuthState = {
  status: "idle" | "error" | "confirm";
  message: string;
  values: { name?: string; email: string; department?: string };
};

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fail = (message: string): AuthState => ({ status: "error", message, values: { email } });

  if (!EMAIL_RE.test(email) || !password) {
    return fail("Entre ton adresse e-mail et ton mot de passe.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return fail("Confirme d'abord ton adresse : ouvre le lien reçu par e-mail.");
    }
    if (error.code === "invalid_credentials") {
      return fail("E-mail ou mot de passe incorrect.");
    }
    console.error("signIn failed:", error.code, error.message);
    return fail("La connexion a échoué. Réessaie dans un instant.");
  }

  redirect("/dashboard");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    department: String(formData.get("department") ?? ""),
  };
  const password = String(formData.get("password") ?? "");
  const level = findLevel(String(formData.get("level") ?? ""));
  const fail = (message: string): AuthState => ({ status: "error", message, values });

  if (!level) redirect("/commencer");
  if (values.name.length < 2 || values.name.length > 80) return fail("Entre ton nom complet.");
  if (values.email.length > 254 || !EMAIL_RE.test(values.email)) {
    return fail("Cette adresse e-mail n'est pas valide.");
  }
  if (!departments.includes(values.department)) {
    return fail("Choisis ton département.");
  }
  if (password.length < 6) return fail("Le mot de passe doit contenir au moins 6 caractères.");
  if (formData.get("terms") !== "on") {
    return fail("Accepte les conditions d'utilisation pour créer ton compte.");
  }

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // Mêmes clés que l'app mobile : le trigger handle_new_user crée le profil avec.
      data: { name: values.name, level: level.slug, department: values.department },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return fail("Un compte existe déjà avec cette adresse. Connecte-toi.");
    }
    if (error.code === "weak_password") {
      return fail("Ce mot de passe est trop faible. Choisis-en un plus long.");
    }
    console.error("signUp failed:", error.code, error.message);
    return fail("Le compte n'a pas pu être créé. Réessaie dans un instant.");
  }

  // Confirmation par e-mail activée : pas encore de session.
  if (!data.session) {
    return {
      status: "confirm",
      message: `Compte créé. Ouvre le lien envoyé à ${values.email} pour l'activer.`,
      values,
    };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
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

  const supabase = await createClient();
  const { error } = await supabase.from("contact_requests").insert(values);

  if (error) {
    console.error("contact insert failed:", error.code, error.message);
    return fail("La demande n'a pas pu être envoyée. Réessayez dans un instant.");
  }

  return success;
}
