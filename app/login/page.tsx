import { LanguageToggle } from "@/components/i18n";
import { buttonClass, inputClass, labelClass } from "@/components/ui";
import { login } from "@/lib/actions";
import { loginConfigured } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = loginConfigured();
  const t = await getT();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 p-4">
      <form action={login} className="w-full max-w-sm rounded-xl border border-line bg-card p-6">
        <h1 className="text-xl font-bold text-pitch">{t.appName}</h1>
        <p className="mt-1 text-sm text-muted">{t.login.prompt}</p>

        <label htmlFor="username" className={`${labelClass} mt-5`}>
          {t.login.username}
        </label>
        <input
          id="username"
          name="username"
          required
          autoFocus
          autoCapitalize="none"
          autoComplete="username"
          className={`${inputClass} mt-1`}
        />

        <label htmlFor="password" className={`${labelClass} mt-3`}>
          {t.login.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={`${inputClass} mt-1`}
        />

        {!configured && (
          <p role="alert" className="mt-3 rounded-lg bg-loss-soft px-3 py-2 text-sm text-loss">
            {t.login.notConfigured}
          </p>
        )}
        {configured && error && (
          <p role="alert" className="mt-3 rounded-lg bg-loss-soft px-3 py-2 text-sm text-loss">
            {t.login.wrong}
          </p>
        )}

        <button type="submit" className={`${buttonClass("primary")} mt-5 w-full`}>
          {t.login.submit}
        </button>
      </form>
      <LanguageToggle />
    </main>
  );
}
