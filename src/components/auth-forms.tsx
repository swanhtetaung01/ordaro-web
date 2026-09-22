"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";

type AuthPayload = {
  kind?: string;
  memberships?: unknown[];
  code?: string;
};

async function postJson(path: string, body: unknown): Promise<AuthPayload> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.status === 204) {
    return {};
  }
  const payload = (await response.json()) as AuthPayload;
  if (!response.ok) {
    throw new Error(payload.code ?? "unknown");
  }
  return payload;
}

function afterAuth(kind: string | undefined, router: ReturnType<typeof useRouter>) {
  router.replace(kind === "PICKER" ? "/businesses" : "/home");
}

export function LoginForm() {
  const t = useTranslations("login");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setError(undefined);
        try {
          const payload = await postJson("/api/auth/login", {
            phone: form.get("phone"),
            password: form.get("password"),
          });
          afterAuth(payload.kind, router);
        } catch (caught) {
          const code = caught instanceof Error ? caught.message : "unknown";
          setError(errors.has(code) ? errors(code) : errors("unknown"));
        } finally {
          setPending(false);
        }
      }}
    >
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Field label={t("phone")} hint={t("phoneHint")} name="phone" type="tel" autoComplete="tel" required />
      <Field label={t("password")} name="password" type="password" autoComplete="current-password" required />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        className="rounded-button bg-indigo px-4 py-3 font-medium text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
      <Link className="text-center text-sm text-teal" href="/signup">
        {t("signup")}
      </Link>
    </form>
  );
}

export function SignupForm() {
  const t = useTranslations("signup");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setError(undefined);
        try {
          const payload = await postJson("/api/auth/signup", {
            fullName: form.get("fullName"),
            businessName: form.get("businessName"),
            phone: form.get("phone"),
            password: form.get("password"),
          });
          afterAuth(payload.kind, router);
        } catch (caught) {
          const code = caught instanceof Error ? caught.message : "unknown";
          setError(errors.has(code) ? errors(code) : errors("unknown"));
        } finally {
          setPending(false);
        }
      }}
    >
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Field label={t("fullName")} name="fullName" autoComplete="name" required />
      <Field label={t("businessName")} name="businessName" required />
      <Field label={t("phone")} hint={t("phoneHint")} name="phone" type="tel" autoComplete="tel" required />
      <Field
        label={t("password")}
        hint={t("passwordHint")}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        className="rounded-button bg-indigo px-4 py-3 font-medium text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
      <Link className="text-center text-sm text-teal" href="/login">
        {t("login")}
      </Link>
    </form>
  );
}

function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        className="rounded-control border border-line px-3 py-2 text-base text-ink outline-none focus:border-indigo"
        {...input}
      />
      {hint ? <span className="text-ink/60">{hint}</span> : null}
    </label>
  );
}
