"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveAd, type FormState } from "@/app/admin/actions";
import { ImageUpload } from "@/components/admin/image-upload";
import { DEPARTMENTS } from "@/lib/content";
import { AD_AUDIENCES, AD_DISPLAY_MODES, AD_PLACEMENTS, AD_SURFACES } from "@/lib/media";

export type AdValues = {
  id?: string;
  title: string;
  image_url: string;
  media_type: string;
  display_mode: string;
  link_url: string;
  surfaces: string[];
  placements: string[];
  departments: string[];
  audience: string;
  starts_on: string;
  ends_on: string;
  active: boolean;
};

const field = "mt-1.5 w-full rounded-xl border border-ink/20 bg-surface px-4 py-3 text-base font-normal";
const label = "block text-sm font-semibold";
const check = "flex min-h-11 items-center gap-3 rounded-xl bg-brand-soft px-3 text-sm font-semibold";

export function AdForm({ values }: { values: AdValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveAd, { error: "" });

  return (
    <form action={action} noValidate className="grid max-w-3xl gap-6 rounded-3xl bg-surface p-5 ring-1 ring-ink/10 sm:p-7">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <label className={label}>
        Titre (sert aussi de description du média)
        <input name="title" required maxLength={120} defaultValue={values.title} className={field} />
      </label>

      <ImageUpload
        name="image_url"
        folder="ads"
        label="Image ou vidéo"
        hint="Image : PNG, JPG ou WebP, 2 Mo max, 1200 × 400 px conseillé. Vidéo : MP4 ou WebM, 20 Mo max, courte (15 s environ), lisible sans le son."
        defaultValue={values.image_url}
        typeName="media_type"
        defaultType={values.media_type}
        wide
      />

      <label className={label}>
        Lien de destination (optionnel)
        <input name="link_url" type="url" inputMode="url" placeholder="https://" defaultValue={values.link_url} className={field} />
        <span className="mt-1 block text-sm font-normal text-ink/60">
          Site, page Facebook, Instagram, WhatsApp… Sans lien, la publicité s&apos;affiche sans être cliquable.
        </span>
      </label>

      <label className={label}>
        Format d&apos;affichage
        <select name="display_mode" defaultValue={values.display_mode} className={field}>
          {AD_DISPLAY_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-sm font-normal text-ink/60">
          Plein écran recouvre toute la page (comme une interstitielle) ; l&apos;élève doit la fermer pour continuer.
          Dans l&apos;application, elle occupe tout l&apos;écran du téléphone : prévois une image verticale
          (1080 × 1920 px), sinon les bords seront rognés.
        </span>
      </label>

      <fieldset>
        <legend className="text-sm font-semibold">Sur quoi l&apos;afficher</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {AD_SURFACES.map((s) => (
            <label key={s.id} className={check}>
              <input type="checkbox" name="surfaces" value={s.id} defaultChecked={values.surfaces.includes(s.id)} className="size-5 accent-brand" />
              {s.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-ink/60">Coche les deux pour l&apos;afficher partout.</p>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">Où l&apos;afficher</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {AD_PLACEMENTS.map((p) => (
            <label key={p.id} className={check}>
              <input type="checkbox" name="placements" value={p.id} defaultChecked={values.placements.includes(p.id)} className="size-5 accent-brand" />
              {p.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-ink/60">
          Sur la page d&apos;accueil, le département du visiteur est inconnu : seules les publicités « tous
          départements, tous les élèves » y apparaissent.
        </p>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">Départements ciblés</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {DEPARTMENTS.map((d) => (
            <label key={d} className={check}>
              <input type="checkbox" name="departments" value={d} defaultChecked={values.departments.includes(d)} className="size-5 accent-brand" />
              {d}
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-ink/60">Aucun coché = visible dans tous les départements.</p>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className={label}>
          Public
          <select name="audience" defaultValue={values.audience} className={field}>
            {AD_AUDIENCES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Date de début
          <input name="starts_on" type="date" defaultValue={values.starts_on} className={field} />
        </label>
        <label className={label}>
          Date de fin (incluse)
          <input name="ends_on" type="date" defaultValue={values.ends_on} className={field} />
        </label>
      </div>
      <p className="-mt-3 text-sm text-ink/60">Dates en heure d&apos;Haïti. Sans date, la publicité s&apos;affiche tant qu&apos;elle est active.</p>

      <label className="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" name="active" defaultChecked={values.active} className="size-5 accent-brand" />
        Active
      </label>

      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-fg">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="h-12 rounded-xl bg-brand px-6 font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <Link href="/admin/publicites" className="grid h-12 place-items-center rounded-xl px-6 font-bold text-ink/70 ring-1 ring-ink/15">
          Annuler
        </Link>
      </div>
    </form>
  );
}
