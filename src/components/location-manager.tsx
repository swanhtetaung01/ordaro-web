"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { PlusIcon } from "@/components/icons";
import { Alert, Badge, Button, ConfirmButton, Field, LoadingRows, Modal, Page, PageHeader, SelectField } from "@/components/ui";
import type { Schemas } from "@/lib/backend";
import { useCodes } from "@/lib/codes";
import { messageFor, readJson } from "@/lib/read-json";

type Location = Schemas["LocationView"];

export function LocationManager() {
  const t = useTranslations("locations");
  const errors = useTranslations("errors");
  const codes = useCodes();
  const [rows, setRows] = useState<Location[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"STORE" | "WAREHOUSE">("STORE");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();

  function load() {
    return readJson<Location[]>("/api/org/locations").then(setRows);
  }

  useEffect(() => {
    void readJson<Location[]>("/api/org/locations")
      .then(setRows)
      .catch((caught) => setError(messageFor(caught, errors, (key) => errors.has(key))))
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- translator identity is not a reload
  }, []);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    setBusy("add");
    try {
      await readJson("/api/org/locations", {
        method: "POST",
        body: JSON.stringify({ code, name, type }),
      });
      setCode("");
      setName("");
      setAdding(false);
      await load();
    } catch (caught) {
      setFormError(messageFor(caught, errors, (key) => errors.has(key)));
    } finally {
      setBusy(undefined);
    }
  }

  async function toggle(row: Location) {
    setError(undefined);
    setBusy(row.id);
    try {
      await readJson(`/api/org/locations/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: row.active === false }),
      });
      await load();
    } catch (caught) {
      setError(messageFor(caught, errors, (key) => errors.has(key)));
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <Page>
      <PageHeader
        actions={
          <Button
            onClick={() => {
              setFormError(undefined);
              setAdding(true);
            }}
            type="button"
          >
            <PlusIcon className="size-5" />
            {t("add")}
          </Button>
        }
        subtitle={t("subtitle")}
        title={t("title")}
      />
      {error ? <Alert>{error}</Alert> : null}

      {!loaded ? (
        <LoadingRows rows={2} />
      ) : (
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-panel border border-line bg-white shadow-xs">
          {rows.map((row) => (
            <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4" key={row.id}>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{row.name}</span>
                  <Badge tone={row.type === "STORE" ? "info" : "muted"}>{codes("locationType", row.type)}</Badge>
                  {row.active === false ? <Badge tone="warn">{t("closed")}</Badge> : null}
                </span>
                <span className="block font-mono text-xs text-slate">{row.code}</span>
              </span>
              <div className="ml-auto">
                {row.active === false ? (
                  <Button busy={busy === row.id} onClick={() => void toggle(row)} type="button" variant="secondary">
                    {t("activate")}
                  </Button>
                ) : (
                  <ConfirmButton
                    busy={busy === row.id}
                    confirmLabel={t("closeConfirm")}
                    label={t("close")}
                    onConfirm={() => void toggle(row)}
                    question={t("closeQuestion", { name: row.name ?? "" })}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal onClose={() => setAdding(false)} open={adding} title={t("create")}>
        <form className="flex flex-col gap-4" onSubmit={(event) => void add(event)}>
          <Field label={t("name")} onChange={(event) => setName(event.target.value)} required value={name} />
          <Field hint={t("codeHint")} label={t("code")} onChange={(event) => setCode(event.target.value)} required value={code} />
          <SelectField label={t("type")} onChange={(event) => setType(event.target.value as typeof type)} value={type}>
            <option value="STORE">{codes("locationType", "STORE")}</option>
            <option value="WAREHOUSE">{codes("locationType", "WAREHOUSE")}</option>
          </SelectField>
          <p className="text-xs text-slate">{t("typeHint")}</p>
          {formError ? <Alert>{formError}</Alert> : null}
          <Button busy={busy === "add"} className="self-start" disabled={!code || !name} type="submit">
            {t("add")}
          </Button>
        </form>
      </Modal>
    </Page>
  );
}
