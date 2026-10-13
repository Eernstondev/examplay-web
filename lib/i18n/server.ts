import { cookies } from "next/headers";
import { cache } from "react";
import { LANG_COOKIE, makeT, parseLang } from "./core";

export const getLang = cache(async () => parseLang((await cookies()).get(LANG_COOKIE)?.value));

export async function getT() {
  return makeT(await getLang());
}
