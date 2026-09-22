"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel, SelectField } from "@/components/ui";
import type { Schemas } from "@/lib/backend";
import { readJson } from "@/lib/read-json";

type Location = Schemas["LocationView"];

export function LocationManager() {
  const t = useTranslations("locations");
  const errors = useTranslations("errors");
  const [rows, setRows] = useState<Location[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"STORE" | "WAREHOUSE">("STORE");
  const [error, setError] = useState<string>();

  function load() {
    return readJson<Location[]>("/api/org/locations").then(setRows);
  }

  useEffect(() => {
    void readJson<Location[]>("/api/org/locations").then(setRows);
  }, []);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Panel title={t("create")}>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(undefined);
            try {
              await readJson("/api/org/locations", {
                method: "POST",
                body: JSON.stringify({ code, name, type }),
              });
              setCode("");
              setName("");
              await load();
            } catch (caught) {
              const codeName = caught instanceof Error ? caught.message : "unknown";
              setError(errors.has(codeName) ? errors(codeName) : errors("unknown"));
            }
          }}
        >
          <Field label={t("code")} onChange={(event) => setCode(event.target.value)} required value={code} />
          <Field label={t("name")} onChange={(event) => setName(event.target.value)} required value={name} />
          <SelectField label={t("type")} onChange={(event) => setType(event.target.value as typeof type)} value={type}>
            <option value="STORE">STORE</option>
            <option value="WAREHOUSE">WAREHOUSE</option>
          </SelectField>
          <Button disabled={!code || !name} type="submit">{t("add")}</Button>
        </form>
      </Panel>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li className="flex items-center justify-between rounded-panel border border-line bg-white px-4 py-3 text-sm" key={row.id}>
            <span>
              <span className="font-mono font-semibold">{row.code}</span> {row.name}
              <span className="ml-2 text-slate">{row.type}</span>
            </span>
            <Button
              onClick={async () => {
                await readJson(`/api/org/locations/${row.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ active: row.active === false }),
                });
                await load();
              }}
              type="button"
              variant="secondary"
            >
              {row.active === false ? t("activate") : t("close")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
