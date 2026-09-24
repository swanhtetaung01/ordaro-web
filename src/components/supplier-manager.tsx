"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel } from "@/components/ui";
import type { Schemas } from "@/lib/backend";
import { readJson } from "@/lib/read-json";

type Supplier = Schemas["SupplierView"];

export function SupplierManager() {
  const t = useTranslations("suppliers");
  const errors = useTranslations("errors");
  const [rows, setRows] = useState<Supplier[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState("0");
  const [error, setError] = useState<string>();

  async function load() {
    setRows(await readJson<Supplier[]>("/api/catalog/suppliers"));
  }

  useEffect(() => {
    void readJson<Supplier[]>("/api/catalog/suppliers").then(setRows);
  }, []);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Panel title={t("create")}>
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(undefined);
            try {
              await readJson("/api/catalog/suppliers", {
                method: "POST",
                body: JSON.stringify({ name, phone, paymentTermsDays: Number(terms || 0) }),
              });
              setName("");
              setPhone("");
              await load();
            } catch (caught) {
              const code = caught instanceof Error ? caught.message : "unknown";
              setError(errors.has(code) ? errors(code) : errors("unknown"));
            }
          }}
        >
          <Field label={t("name")} onChange={(event) => setName(event.target.value)} required value={name} />
          <Field label={t("phone")} onChange={(event) => setPhone(event.target.value)} value={phone} />
          <Field inputMode="numeric" label={t("terms")} onChange={(event) => setTerms(event.target.value)} value={terms} />
          <Button disabled={!name} type="submit">{t("add")}</Button>
        </form>
      </Panel>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li className="rounded-panel border border-line bg-white px-4 py-3 text-sm" key={row.id}>
            <span className="font-semibold">{row.name}</span>
            <span className="ml-2 text-slate">{row.phone}</span>
            <span className="ml-2 font-mono text-slate">{row.paymentTermsDays}d</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
