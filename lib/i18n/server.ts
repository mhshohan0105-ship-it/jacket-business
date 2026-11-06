import { cookies } from "next/headers";
import { isLang, LANG_COOKIE, messages, type Lang } from "./messages";

/** The viewer's chosen language. Bengali unless they switched. */
export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : "bn";
}

export async function getT() {
  return messages[await getLang()];
}
