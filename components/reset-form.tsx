"use client";

import { useActionState } from "react";
import { confirmReset, requestReset, type ResetState } from "@/app/actions";
import { PasswordInput } from "@/components/password-field";
import { Turnstile } from "@/components/turnstile";
import { useT } from "@/components/i18n-provider";

const field =
  "mt-1.5 h-13 w-full rounded-xl border border-ink/15 bg-surface px-4 text-base text-ink placeholder:text-ink/40";
const label = "block text-sm font-medium";
const submit =
  "h-12 w-full rounded-full bg-brand text-base font-medium text-white hover:bg-brand-dark disabled:opacity-60";

function ErrorMessage({ error }: { error: string }) {
  const t = useT();
  return error ? (
    <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-fg">
      {t(error)}
    </p>
  ) : null;
}

function CodeStep({ email }: { email: string }) {
  const t = useT();
  const [state, action, pending] = useActionState<ResetState, FormData>(confirmReset, {
    step: "code",
    email,
    error: "",
  });
  return (
    <form action={action} noValidate className="grid gap-4">
      <p role="status" className="rounded-xl bg-brand-soft px-4 py-3 text-sm leading-relaxed">
        {t("Si un compte existe pour ")}<strong>{email}</strong>{t(", un code vient d'être envoyé à cette adresse. Pense à regarder dans les courriers indésirables.")}
      </p>
      <input type="hidden" name="email" value={email} />
      <label className={label}>
        {t("Code reçu par e-mail")}
        <input name="code" inputMode="numeric" autoComplete="one-time-code" required className={field} />
      </label>
      <label className={label}>
        {t("Nouveau mot de passe")}
        <PasswordInput name="password" required minLength={6} autoComplete="new-password" />
        <span className="mt-1.5 block text-sm font-normal text-ink/60">{t("6 caractères minimum.")}</span>
      </label>
      <ErrorMessage error={state.error} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? t("Enregistrement…") : t("Changer mon mot de passe")}
      </button>
    </form>
  );
}

export function ResetForm() {
  const t = useT();
  const [state, action, pending] = useActionState<ResetState, FormData>(requestReset, {
    step: "email",
    email: "",
    error: "",
  });

  if (state.step === "code") return <CodeStep email={state.email} />;

  return (
    <form action={action} noValidate className="grid gap-4">
      <label className={label}>
        {t("Adresse e-mail")}
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue={state.email}
          className={field}
        />
      </label>
      <Turnstile resetKey={state} />
      <ErrorMessage error={state.error} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? t("Envoi…") : t("Recevoir un code")}
      </button>
    </form>
  );
}
