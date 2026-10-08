import { ALL_SUBJECTS } from "@/lib/content";

// Formulaire GET : recharge la page avec ?subject=… (et la recherche éventuelle).
export function SubjectPicker({ subject, search }: { subject?: string; search?: string }) {
  const field = "mt-1.5 h-12 w-full rounded-xl border border-ink/20 bg-surface px-3 text-base font-normal";
  return (
    <form className="flex flex-wrap items-end gap-3 rounded-3xl bg-surface p-4 ring-1 ring-ink/10">
      <label className="block min-w-52 flex-1 text-sm font-semibold">
        Matière
        <select name="subject" defaultValue={subject ?? ""} required className={field}>
          <option value="" disabled>
            Choisis une matière
          </option>
          {ALL_SUBJECTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      {search !== undefined && (
        <label className="block min-w-52 flex-1 text-sm font-semibold">
          Mots de l&apos;énoncé
          <input type="search" name="q" defaultValue={search} className={field} />
        </label>
      )}
      <button type="submit" className="h-12 rounded-xl bg-navy px-5 font-bold text-white">
        {search !== undefined ? "Chercher" : "Continuer"}
      </button>
    </form>
  );
}
