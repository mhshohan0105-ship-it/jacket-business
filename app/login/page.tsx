import { buttonClass, inputClass, labelClass } from "@/components/ui";
import { login } from "@/lib/actions";
import { loginConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = loginConfigured();

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <form action={login} className="w-full max-w-sm rounded-xl border border-line bg-card p-6">
        <h1 className="text-xl font-bold text-pitch">জ্যাকেট হিসাব</h1>
        <p className="mt-1 text-sm text-muted">ঢুকতে লগইন করুন</p>

        <label htmlFor="username" className={`${labelClass} mt-5`}>
          ইউজারনেম
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
          পাসওয়ার্ড
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
            সার্ভারে APP_USERNAME ও APP_PASSWORD সেট করা নেই, তাই এখন কেউ ঢুকতে পারবে না।
          </p>
        )}
        {configured && error && (
          <p role="alert" className="mt-3 rounded-lg bg-loss-soft px-3 py-2 text-sm text-loss">
            ইউজারনেম বা পাসওয়ার্ড ঠিক নেই।
          </p>
        )}

        <button type="submit" className={`${buttonClass("primary")} mt-5 w-full`}>
          লগইন করুন
        </button>
      </form>
    </main>
  );
}
