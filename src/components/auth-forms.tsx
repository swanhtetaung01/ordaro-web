"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Alert, Button, Field, linkClasses } from "@/components/ui";
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
  router.replace(kind === "PICKER" ? "/businesses" : "/dashboard");
}

export function LoginForm() {
  const t = useTranslations("login");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <form
      className="flex flex-col gap-6"
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
      <h1 className="text-2xl font-bold tracking-tight text-ink">{t("title")}</h1>
      <div className="flex flex-col gap-4">
        <Field autoComplete="tel" hint={t("phoneHint")} label={t("phone")} name="phone" required type="tel" />
        <Field autoComplete="current-password" label={t("password")} name="password" required type="password" />
      </div>
      {error ? <Alert>{error}</Alert> : null}
      <Button busy={pending} className="w-full" size="lg" type="submit">
        {pending ? t("submitting") : t("submit")}
      </Button>
      <p className="text-center text-sm">
        <Link className={linkClasses} href="/signup">
          {t("signup")}
        </Link>
      </p>
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
      className="flex flex-col gap-6"
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
            signupCode: form.get("signupCode") || undefined,
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
      <h1 className="text-2xl font-bold tracking-tight text-ink">{t("title")}</h1>
      <div className="flex flex-col gap-4">
        <Field autoComplete="name" label={t("fullName")} name="fullName" required />
        <Field label={t("businessName")} name="businessName" required />
        <Field autoComplete="tel" hint={t("phoneHint")} label={t("phone")} name="phone" required type="tel" />
        <Field
          autoComplete="new-password"
          hint={t("passwordHint")}
          label={t("password")}
          minLength={8}
          name="password"
          required
          type="password"
        />
        <Field autoComplete="off" hint={t("codeHint")} label={t("code")} name="signupCode" />
      </div>
      {error ? <Alert>{error}</Alert> : null}
      <Button busy={pending} className="w-full" size="lg" type="submit">
        {pending ? t("submitting") : t("submit")}
      </Button>
      <p className="text-center text-sm">
        <Link className={linkClasses} href="/login">
          {t("login")}
        </Link>
      </p>
    </form>
  );
}
