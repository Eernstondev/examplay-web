import { getContext } from "@/lib/data";

// Rôles lus dans le contexte du compte (un seul appel par requête, partagé avec getAccount).
// Les règles RLS de la base restent la vraie protection.
export const isAdmin = async (): Promise<boolean> => (await getContext())?.is_admin === true;

// Contributeur (enseignant, expert) approuvé.
export const isContributor = async (): Promise<boolean> => (await getContext())?.is_contributor === true;
