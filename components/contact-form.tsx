"use client";

import { useActionState } from "react";
import { sendContactRequest, type ContactState } from "@/app/actions";
import { Turnstile } from "@/components/turnstile";
import { contactSubjects } from "@/lib/contact";
import { useT } from "@/components/i18n-provider";

const initialState: ContactState = {
  status: "idle",
  message: "",
  values: { name: "", email: "", subject: "", message: "" },
};

const field =
  "mt-1.5 w-full rounded-lg border border-ink/20 bg-surface px-4 py-3 text-ink placeholder:text-ink/40";

export function ContactForm() {
  const t = useT();
  const [state, action, pending] = useActionState(sendContactRequest, initialState);

  if (state.status === "success") {
    return (
      <p role="status" className="text-lg font-medium">
        {t(state.message)}
      </p>
    );
  }

  return (
    <form action={action} noValidate className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t("Nom complet ou organisation")}
          <input
            name="name"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            defaultValue={state.values.name}
            className={field}
          />
        </label>
        <label className="block text-sm font-medium">
          {t("Adresse e-mail professionnelle")}
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            defaultValue={state.values.email}
            className={field}
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        {t("Sujet")}
        <select name="subject" required defaultValue={state.values.subject} className={field}>
          <option value="" disabled>
            {t("Sélectionnez un sujet")}
          </option>
          {contactSubjects.map((s) => (
            <option key={s.value} value={s.value}>
              {t(s.label)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        {t("Message")}
        <textarea
          name="message"
          required
          rows={6}
          maxLength={4000}
          defaultValue={state.values.message}
          className={field}
        />
      </label>
      {/* Champ piège anti-robots */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <Turnstile resetKey={state} />
      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-danger-fg">
          {t(state.message)}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 justify-self-start rounded-lg bg-brand px-6 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? t("Envoi…") : t("Envoyer la demande")}
      </button>
    </form>
  );
}
