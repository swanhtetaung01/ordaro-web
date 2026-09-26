"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { PlusIcon, UsersIcon } from "@/components/icons";
import { Alert, Button, EmptyState, Field, LoadingRows, Modal, Page, PageHeader } from "@/components/ui";
import type { Schemas } from "@/lib/backend";
import { messageFor, readJson } from "@/lib/read-json";

type Supplier = Schemas["SupplierView"];

export function SupplierManager() {
  const t = useTranslations("suppliers");
  const errors = useTranslations("errors");
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState("0");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();

  async function load() {
    setRows(await readJson<Supplier[]>("/api/catalog/suppliers"));
  }

  useEffect(() => {
    void readJson<Supplier[]>("/api/catalog/suppliers")
      .then(setRows)
      .catch((caught) => setError(messageFor(caught, errors, (code) => errors.has(code))))
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- translator identity is not a reload
  }, []);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    setBusy(true);
    try {
      await readJson("/api/catalog/suppliers", {
        method: "POST",
        body: JSON.stringify({ name, phone, paymentTermsDays: Number(terms || 0) }),
      });
      setName("");
      setPhone("");
      setAdding(false);
      await load();
    } catch (caught) {
      setFormError(messageFor(caught, errors, (code) => errors.has(code)));
    } finally {
      setBusy(false);
    }
  }

  const addButton = (variant: "primary" | "secondary") => (
    <Button
      onClick={() => {
        setFormError(undefined);
        setAdding(true);
      }}
      type="button"
      variant={variant}
    >
      <PlusIcon className="size-5" />
      {t("add")}
    </Button>
  );

  return (
    <Page>
      <PageHeader actions={addButton("primary")} subtitle={t("subtitle")} title={t("title")} />
      {error ? <Alert>{error}</Alert> : null}

      {!loaded ? (
        <LoadingRows rows={3} />
      ) : rows.length === 0 ? (
        error ? null : <EmptyState action={addButton("secondary")} hint={t("emptyHint")} icon={<UsersIcon className="size-6" />} title={t("empty")} />
      ) : (
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-panel border border-line bg-white shadow-xs">
          {rows.map((row) => (
            <li className="flex items-center gap-4 px-4 py-4" key={row.id}>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink">{row.name}</span>
                <span className="block truncate text-xs text-slate tabular-nums">{row.phone || "—"}</span>
              </span>
              <span className="shrink-0 text-sm text-slate">{t("termsDays", { count: row.paymentTermsDays ?? 0 })}</span>
            </li>
          ))}
        </ul>
      )}

      <Modal onClose={() => setAdding(false)} open={adding} title={t("create")}>
        <form className="flex flex-col gap-4" onSubmit={(event) => void add(event)}>
          <Field label={t("name")} onChange={(event) => setName(event.target.value)} required value={name} />
          <Field label={t("phone")} onChange={(event) => setPhone(event.target.value)} type="tel" value={phone} />
          <Field hint={t("termsHint")} inputMode="numeric" label={t("terms")} onChange={(event) => setTerms(event.target.value)} value={terms} />
          {formError ? <Alert>{formError}</Alert> : null}
          <Button busy={busy} className="self-start" disabled={!name} type="submit">
            {t("add")}
          </Button>
        </form>
      </Modal>
    </Page>
  );
}
