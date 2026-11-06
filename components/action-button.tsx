"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/actions";
import { buttonClass } from "./ui";

/** Runs a server action from a button, with optional confirm and inline error. */
export function ActionButton({
  action,
  confirm,
  kind = "secondary",
  children,
}: {
  action: () => Promise<ActionResult>;
  confirm?: string;
  kind?: Parameters<typeof buttonClass>[0];
  children: ReactNode;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  return (
    <>
      <button
        type="button"
        disabled={pending}
        className={buttonClass(kind)}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError("");
          start(async () => {
            const result = await action();
            if (!result.ok) setError(result.error);
          });
        }}
      >
        {children}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-loss">
          {error}
        </p>
      )}
    </>
  );
}
