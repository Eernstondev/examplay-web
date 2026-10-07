"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestEnrollment, type EnrollState } from "@/app/dashboard/cours/actions";
import { primaryButton } from "@/components/app/ui";

const inputClass = "mt-1.5 h-12 w-full rounded-xl border border-ink/20 bg-white px-3 text-base font-normal";

export function EnrollForm({
  subject,
  subjectName,
  priceLabel,
  paymentInfo,
  defaultName,
  email,
}: {
  subject: string;
  subjectName: string;
  priceLabel: string;
  paymentInfo: string;
  defaultName: string;
  email: string;
}) {
  const [state, action, pending] = useActionState<EnrollState, FormData>(requestEnrollment, {
    error: "",
    done: false,
  });

  if (state.done) {
    return (
      <section role="status" className="mt-5 rounded-3xl bg-white p-6 text-center ring-1 ring-ink/10">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-success">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2 className="mt-4 font-display text-2xl font-extrabold">Inscription envoyée</h2>
        <p className="mx-auto mt-2 max-w-md leading-relaxed text-ink/75">
          Ta demande pour <strong>{subjectName}</strong> est en cours de vérification. Tu recevras une notification dès
          qu&apos;elle sera confirmée.
        </p>
        <Link href="/dashboard/cours" className={`${primaryButton} mx-auto mt-5 sm:max-w-xs`}>
          Retour aux cours
        </Link>
      </section>
    );
  }

  return (
    <form action={action} className="mt-5 max-w-xl rounded-3xl bg-white p-5 ring-1 ring-ink/10 sm:p-6">
      <input type="hidden" name="subject" value={subject} />

      <p className="rounded-2xl bg-brand-soft px-4 py-3 text-sm font-semibold">
        Prix du cours : <span className="font-display text-lg font-extrabold text-brand">{priceLabel}</span>
      </p>
      {paymentInfo && (
        <p className="mt-3 whitespace-pre-line rounded-2xl bg-sun/20 px-4 py-3 text-sm leading-relaxed">
          <strong>Comment payer :</strong> {paymentInfo}
          {"\n"}Paye d&apos;abord, puis saisis ci-dessous l&apos;identifiant de ta transaction.
        </p>
      )}

      <div className="mt-5 grid gap-4">
        <label className="block text-sm font-semibold">
          Nom complet
          <input
            name="full_name"
            required
            minLength={3}
            maxLength={100}
            autoComplete="name"
            defaultValue={defaultName}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-semibold">
          E-mail
          <input value={email} readOnly aria-readonly="true" className={`${inputClass} bg-ink/5 text-ink/70`} />
        </label>
        <label className="block text-sm font-semibold">
          Numéro de téléphone
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            placeholder="+509 38 00 00 00"
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-semibold">
          Identifiant de la transaction MonCash / NatCash
          <input name="payment_ref" required minLength={4} maxLength={40} autoComplete="off" className={inputClass} />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={`${primaryButton} mt-5`}>
        {pending ? "Envoi…" : "Envoyer mon inscription"}
      </button>
    </form>
  );
}
