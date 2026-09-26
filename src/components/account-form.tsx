"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Alert, Button, Field, Page, PageHeader, Panel } from "@/components/ui";
import { messageFor, readResponse } from "@/lib/read-json";

/** Change your own password. Every other phone and browser signed in as you is signed out. */
export function AccountForm() {
  const t = useTranslations("account");
  const errors = useTranslations("errors");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Page width="narrow">
      <PageHeader subtitle={t("subtitle")} title={t("title")} />
      <Panel title={t("changePassword")}>
        <form
          className="flex max-w-md flex-col gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(undefined);
            setSaved(false);
            if (next !== again) {
              setError(t("mismatch"));
              return;
            }
            setPending(true);
            try {
              await readResponse("/api/auth/password", {
                method: "POST",
                body: JSON.stringify({ currentPassword: current, newPassword: next }),
              });
              setSaved(true);
              setCurrent("");
              setNext("");
              setAgain("");
            } catch (caught) {
              setError(messageFor(caught, errors, (code) => errors.has(code)));
            } finally {
              setPending(false);
            }
          }}
        >
          <Field autoComplete="current-password" label={t("current")} onChange={(event) => setCurrent(event.target.value)}
            required type="password" value={current} />
          <Field autoComplete="new-password" hint={t("newHint")} label={t("new")} minLength={8}
            onChange={(event) => setNext(event.target.value)} required type="password" value={next} />
          <Field autoComplete="new-password" label={t("again")} minLength={8} onChange={(event) => setAgain(event.target.value)}
            required type="password" value={again} />
          {error ? <Alert>{error}</Alert> : null}
          {saved ? <Alert tone="success">{t("saved")}</Alert> : null}
          <Button busy={pending} className="self-start" type="submit">{t("save")}</Button>
        </form>
      </Panel>
    </Page>
  );
}
