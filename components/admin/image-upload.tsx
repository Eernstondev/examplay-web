"use client";

import { useState } from "react";
import { MEDIA_BUCKET } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";

const IMAGES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const VIDEOS: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm" };
const MAX_IMAGE = 2 * 1024 * 1024;
const MAX_VIDEO = 20 * 1024 * 1024;

type Props = {
  name: string;
  folder: string;
  label: string;
  hint: string;
  defaultValue?: string;
  wide?: boolean;
  // Si renseigné, les vidéos sont acceptées et le type est envoyé dans ce champ.
  typeName?: string;
  defaultType?: string;
};

// Envoie le fichier dans Supabase Storage et place son adresse dans le formulaire.
export function ImageUpload({ name, folder, label, hint, defaultValue = "", wide, typeName, defaultType = "image" }: Props) {
  const [url, setUrl] = useState(defaultValue);
  const [type, setType] = useState(defaultType);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const accepted = typeName ? { ...IMAGES, ...VIDEOS } : IMAGES;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    const ext = accepted[file.type];
    const isVideo = file.type in VIDEOS;
    if (!ext) {
      return setError(typeName ? "Format accepté : PNG, JPG, WebP, MP4 ou WebM." : "Format accepté : PNG, JPG ou WebP.");
    }
    if (file.size > (isVideo ? MAX_VIDEO : MAX_IMAGE)) {
      return setError(isVideo ? "La vidéo dépasse 20 Mo. Compresse-la puis réessaie." : "L'image dépasse 2 Mo. Réduis-la puis réessaie.");
    }

    setBusy(true);
    const supabase = createClient();
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    setBusy(false);
    if (uploadError) return setError("L'envoi a échoué. Vérifie ta connexion et tes droits admin.");
    setUrl(supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl);
    setType(isVideo ? "video" : "image");
  };

  const preview = `rounded-xl bg-white ring-1 ring-ink/10 ${wide ? "aspect-[3/1] w-full max-w-md object-cover" : "size-24 object-contain p-2"}`;

  return (
    <div>
      <label className="block text-sm font-semibold">
        {label}
        <input
          type="file"
          accept={Object.keys(accepted).join(",")}
          onChange={(e) => upload(e.target.files?.[0])}
          className="mt-1.5 block w-full text-sm font-normal file:mr-3 file:h-11 file:rounded-xl file:border-0 file:bg-brand-soft file:px-4 file:font-bold file:text-brand"
        />
      </label>
      <p className="mt-1 text-sm text-ink/60">{busy ? "Envoi en cours…" : hint}</p>
      {error && (
        <p role="alert" className="mt-1 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <input type="hidden" name={name} value={url} />
      {typeName && <input type="hidden" name={typeName} value={type} />}
      {url && (
        <div className="mt-3 flex items-end gap-3">
          {type === "video" ? (
            <video src={url} controls muted playsInline preload="metadata" className={preview} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Aperçu" className={preview} />
          )}
          <button type="button" onClick={() => setUrl("")} className="min-h-11 text-sm font-semibold text-danger underline underline-offset-4">
            Retirer
          </button>
        </div>
      )}
    </div>
  );
}
