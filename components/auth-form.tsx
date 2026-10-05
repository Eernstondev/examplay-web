"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions";
import { departments } from "@/lib/levels";

const initialState: AuthState = { status: "idle", message: "", values: { email: "" } };

const field =
  "mt-1.5 h-13 w-full rounded-xl border border-ink/20 bg-white px-4 text-base text-ink placeholder:text-ink/40";
const label = "block text-sm font-semibold";
const submit =
  "h-13 w-full rounded-xl bg-brand text-base font-bold text-white hover:bg-brand-dark disabled:opacity-60";

function ErrorMessage({ state }: { state: AuthState }) {
  if (state.status !== "error") return null;
  return (
    <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
      {state.message}
    </p>
  );
}

export function SignInForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <form action={action} noValidate className="grid gap-4">
      {notice && state.status === "idle" && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {notice}
        </p>
      )}
      <label className={label}>
        Adresse e-mail
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
        Mot de passe
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={field}
        />
      </label>
      <ErrorMessage state={state} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

export function SignUpForm({ level }: { level: string }) {
  const [state, action, pending] = useActionState(signUp, initialState);

  if (state.status === "confirm") {
    return (
      <p role="status" className="rounded-xl bg-success-soft px-4 py-4 font-semibold text-success">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} noValidate className="grid gap-4">
      <input type="hidden" name="level" value={level} />
      <label className={label}>
        Nom complet
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
        Adresse e-mail
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
        Département
        <select
          name="department"
          required
          defaultValue={state.values.department ?? ""}
          className={field}
        >
          <option value="" disabled>
            Choisis ton département
          </option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        Mot de passe
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          aria-describedby="password-hint"
          className={field}
        />
        <span id="password-hint" className="mt-1.5 block text-sm font-normal text-ink/60">
          6 caractères minimum.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" name="terms" required className="mt-0.5 size-5 shrink-0 accent-brand" />
        <span>
          J&apos;accepte les{" "}
          <Link href="/conditions" target="_blank" className="font-semibold text-brand underline underline-offset-2">
            conditions d&apos;utilisation
          </Link>{" "}
          et la{" "}
          <Link href="/confidentialite" target="_blank" className="font-semibold text-brand underline underline-offset-2">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>
      <ErrorMessage state={state} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? "Création du compte…" : "Créer mon compte"}
      </button>
    </form>
  );
}
