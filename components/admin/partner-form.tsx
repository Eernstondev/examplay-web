"use client";

import Link from "next/link";
import { useActionState } from "react";
import { savePartner, type FormState } from "@/app/admin/actions";
import { ImageUpload } from "@/components/admin/image-upload";
import { PARTNER_CATEGORIES } from "@/lib/media";

export type PartnerValues = {
  id?: string;
  category: string;
  name: string;
  description: string;
  logo_url: string;
  website: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  order_index: number;
  active: boolean;
};

const field = "mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 text-base font-normal";
const label = "block text-sm font-semibold";

export function PartnerForm({ values }: { values: PartnerValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePartner, { error: "" });

  return (
    <form action={action} noValidate className="grid max-w-3xl gap-5 rounded-3xl bg-white p-5 ring-1 ring-ink/10 sm:p-7">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          Rubrique
          <select name="category" defaultValue={values.category} className={field}>
            {PARTNER_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Nom
          <input name="name" required maxLength={120} defaultValue={values.name} className={field} />
        </label>
      </div>

      <label className={label}>
        Texte de présentation
        <textarea name="description" rows={4} maxLength={600} defaultValue={values.description} className={field} />
      </label>

      <ImageUpload
        name="logo_url"
        folder="partners"
        label="Logo"
        hint="PNG, JPG ou WebP, 2 Mo maximum. Un logo carré sur fond blanc ou transparent rend le mieux."
        defaultValue={values.logo_url}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {(
          [
            ["website", "Site web"],
            ["facebook", "Facebook"],
            ["instagram", "Instagram"],
            ["tiktok", "TikTok"],
          ] as const
        ).map(([name, text]) => (
          <label key={name} className={label}>
            {text} (lien complet)
            <input
              name={name}
              type="url"
              inputMode="url"
              placeholder="https://"
              defaultValue={values[name]}
              className={field}
            />
          </label>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 sm:items-end">
        <label className={label}>
          Ordre d&apos;affichage (le plus petit en premier)
          <input name="order_index" type="number" defaultValue={values.order_index} className={field} />
        </label>
        <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="active" defaultChecked={values.active} className="size-5 accent-brand" />
          Visible sur le site
        </label>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="h-12 rounded-xl bg-brand px-6 font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <Link href="/admin/partenaires" className="grid h-12 place-items-center rounded-xl px-6 font-bold text-ink/70 ring-1 ring-ink/15">
          Annuler
        </Link>
      </div>
    </form>
  );
}
