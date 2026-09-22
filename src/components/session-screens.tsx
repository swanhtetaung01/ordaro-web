"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import type { Membership } from "@/lib/backend";

type Session =
  | { authenticated: false; memberships: Membership[] }
  | { authenticated: true; kind?: string; memberships: Membership[] };

export function BusinessPicker() {
  const t = useTranslations("picker");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [session, setSession] = useState<Session>();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const response = await fetch("/api/auth/session");
    const body = (await response.json()) as Session;
    if (!body.authenticated) {
      router.replace("/login");
      return;
    }
    setSession(body);
  }

  async function enter(organizationId: string | undefined) {
    if (!organizationId) {
      return;
    }
    setBusy(organizationId);
    setError(undefined);
    const response = await fetch("/api/auth/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { code?: string };
      const code = body.code ?? "unknown";
      setError(errors.has(code) ? errors(code) : errors("unknown"));
      setBusy(undefined);
      return;
    }
    router.replace("/products");
  }

  async function accept(membershipId: string | undefined) {
    if (!membershipId) {
      return;
    }
    setBusy(membershipId);
    setError(undefined);
    const response = await fetch(`/api/auth/invitations/${membershipId}/accept`, { method: "POST" });
    if (!response.ok) {
      const body = (await response.json()) as { code?: string };
      const code = body.code ?? "unknown";
      setError(errors.has(code) ? errors(code) : errors("unknown"));
      setBusy(undefined);
      return;
    }
    await load();
    setBusy(undefined);
  }

  const rows = session?.memberships ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {session && rows.length === 0 ? <p className="text-sm text-ink/70">{t("empty")}</p> : null}
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.membershipId} className="rounded-button border border-line p-3">
            <p className="font-medium">{row.organizationName}</p>
            <p className="text-sm text-ink/70">
              {row.displayName}
              {row.status === "INVITED" ? ` · ${t("invited")}` : null}
            </p>
            {row.status === "INVITED" ? (
              <button
                className="mt-3 rounded-button bg-teal px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={busy === row.membershipId}
                onClick={() => accept(row.membershipId)}
                type="button"
              >
                {busy === row.membershipId ? t("accepting") : t("accept")}
              </button>
            ) : (
              <button
                className="mt-3 rounded-button bg-indigo px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={busy === row.organizationId || row.status !== "ACTIVE"}
                onClick={() => enter(row.organizationId)}
                type="button"
              >
                {busy === row.organizationId ? t("entering") : t("enter")}
              </button>
            )}
          </li>
        ))}
      </ul>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SignOut label={t("logout")} />
    </div>
  );
}

export function SignedInHome() {
  const t = useTranslations("home");
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/auth/session");
      const body = (await response.json()) as Session;
      if (!body.authenticated) {
        router.replace("/login");
        return;
      }
      if (body.kind === "PICKER") {
        router.replace("/businesses");
        return;
      }
      setReady(true);
    })();
  }, [router]);

  if (!ready) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-ink/70">{t("next")}</p>
      <button
        className="rounded-button bg-indigo px-4 py-3 text-left font-medium text-white"
        onClick={() => router.push("/products")}
        type="button"
      >
        {t("products")}
      </button>
      <button
        className="rounded-button border border-line px-4 py-3 text-left font-medium"
        onClick={() => router.push("/businesses")}
        type="button"
      >
        {t("businesses")}
      </button>
      <SignOut label={t("logout")} pendingLabel={t("signingOut")} />
    </div>
  );
}

function SignOut({ label, pendingLabel }: { label: string; pendingLabel?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      className="text-sm text-teal disabled:opacity-60"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
      }}
      type="button"
    >
      {pending && pendingLabel ? pendingLabel : label}
    </button>
  );
}
