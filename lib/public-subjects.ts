import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type PublicChapter = { title: string; questions: number; annales: number };
export type PublicQuestion = {
  question: string;
  choices: string[];
  answer: number;
  explain: string;
  chapter: string | null;
  year: number | null;
};

// Aperçu public d'une matière (chapitres + quelques questions corrigées), mis en cache 1 h.
// Fonctions SQL limitées : 20261034_public_subjects.sql.
export const getSubjectPreview = unstable_cache(
  async (subject: string): Promise<{ chapters: PublicChapter[]; samples: PublicQuestion[] }> => {
    const db = createPublicClient();
    const [chapters, samples] = await Promise.all([
      db.rpc("public_subject_chapters", { p_subject: subject }),
      db.rpc("public_sample_questions", { p_subject: subject }),
    ]);
    return {
      chapters: (chapters.data ?? []).map((c: { title: string; questions: number; annales: number }) => ({
        title: c.title,
        questions: Number(c.questions),
        annales: Number(c.annales),
      })),
      samples: (samples.data ?? []).filter(
        (q: PublicQuestion) =>
          Array.isArray(q.choices) && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length,
      ),
    };
  },
  ["subject-preview"],
  { revalidate: 3600 },
);
