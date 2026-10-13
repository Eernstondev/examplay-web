"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions";
import { PasswordInput } from "@/components/password-field";
import { Turnstile } from "@/components/turnstile";
import { departments } from "@/lib/levels";
import { useT } from "@/components/i18n-provider";

const initialState: AuthState = { status: "idle", message: "", values: { email: "" } };

const field =
  "mt-1.5 h-13 w-full rounded-xl border border-ink/20 bg-surface px-4 text-base text-ink placeholder:text-ink/40";
const label = "block text-sm font-semibold";
const submit =
  "h-13 w-full rounded-xl bg-brand text-base font-bold text-white hover:bg-brand-dark disabled:opacity-60";

function ErrorMessage({ state }: { state: AuthState }) {
  const t = useT();
  if (state.status !== "error") return null;
  return (
    <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-fg">
      {t(state.message)}
    </p>
  );
}

export function SignInForm({ notice, success }: { notice?: string; success?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <form action={action} noValidate className="grid gap-4">
      {success && state.status === "idle" && (
        <p role="status" className="rounded-xl bg-success-soft px-4 py-3 text-sm font-semibold text-success-fg">
          {success}
        </p>
      )}
      {notice && state.status === "idle" && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-fg">
          {notice}
        </p>
      )}
      <label className={label}>
        {t("Adresse e-mail")}
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values.email}
          className={field}
        />
      </label>
      <label className={label}>
        {t("Mot de passe")}
        <PasswordInput name="password" required autoComplete="current-password" />
      </label>
      <ErrorMessage state={state} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? t("Connexion…") : t("Se connecter")}
      </button>
      <Link href="/mot-de-passe-oublie" className="justify-self-center py-1 text-sm font-semibold text-brand-fg underline underline-offset-4">
        {t("Mot de passe oublié ?")}
      </Link>
    </form>
  );
}

export function SignUpForm({ level, referral = "" }: { level: string; referral?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(signUp, initialState);

  if (state.status === "confirm") {
    return (
      <p role="status" className="rounded-xl bg-success-soft px-4 py-4 font-semibold text-success-fg">
        {t(state.message)}
      </p>
    );
  }

  return (
    <form action={action} noValidate className="grid gap-4">
      <input type="hidden" name="level" value={level} />
      <label className={label}>
        {t("Nom complet")}
        <input
          name="name"
          type="text"
          required
          maxLength={80}
          autoComplete="name"
          defaultValue={state.values.name}
          className={field}
        />
      </label>
      <label className={label}>
        {t("Adresse e-mail")}
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values.email}
          className={field}
        />
      </label>
      <label className={label}>
        {t("Département")}
        <select
          name="department"
          required
          defaultValue={state.values.department ?? ""}
          className={field}
        >
          <option value="" disabled>
            {t("Choisis ton département")}
          </option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        {t("Mot de passe")}
        <PasswordInput name="password" required minLength={6} autoComplete="new-password" aria-describedby="password-hint" />
        <span id="password-hint" className="mt-1.5 block text-sm font-normal text-ink/60">
          {t("6 caractères minimum.")}
        </span>
      </label>
      <label className={label}>
        {t("Code de parrainage ")}<span className="font-normal text-ink/60">{t("(facultatif)")}</span>
        <input
          name="referral"
          type="text"
          maxLength={32}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          defaultValue={referral}
          className={field}
        />
      </label>
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" name="terms" required className="mt-0.5 size-5 shrink-0 accent-brand" />
        <span>
          {t("J'accepte les")}{" "}
          <Link href="/conditions" target="_blank" className="font-semibold text-brand-fg underline underline-offset-2">
            {t("conditions d'utilisation")}
          </Link>{" "}
          {t("et la")}{" "}
          <Link href="/confidentialite" target="_blank" className="font-semibold text-brand-fg underline underline-offset-2">
            {t("politique de confidentialité")}
          </Link>
          .
        </span>
      </label>
      <Turnstile resetKey={state} />
      <ErrorMessage state={state} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? t("Création du compte…") : t("Créer mon compte")}
      </button>
    </form>
  );
}
