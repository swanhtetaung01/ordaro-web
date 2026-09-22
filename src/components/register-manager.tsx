"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel, SelectField } from "@/components/ui";
import { useRouter } from "@/i18n/navigation";
import type { Schemas } from "@/lib/backend";
import { readJson } from "@/lib/read-json";

type Register = Schemas["RegisterView"];
type Location = Schemas["LocationView"];

export function RegisterManager() {
  const t = useTranslations("registers");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [rows, setRows] = useState<Register[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [label, setLabel] = useState("");
  const [credential, setCredential] = useState<string>();
  const [error, setError] = useState<string>();

  function load() {
    return readJson<Register[]>("/api/registers").then(setRows);
  }

  useEffect(() => {
    void readJson<Register[]>("/api/registers").then(setRows);
    void readJson<Location[]>("/api/org/locations").then((next) => {
      const stores = next.filter((row) => row.type === "STORE");
      setLocations(stores);
      if (stores[0]?.id) {
        setLocationId(stores[0].id);
      }
    });
  }, []);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Panel title={t("bind")}>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(undefined);
            try {
              const bound = await readJson<Schemas["BoundView"]>("/api/registers", {
                method: "POST",
                body: JSON.stringify({ locationId, label }),
              });
              setCredential(bound.deviceCredential);
              setLabel("");
              await load();
            } catch (caught) {
              const code = caught instanceof Error ? caught.message : "unknown";
              setError(errors.has(code) ? errors(code) : errors("unknown"));
            }
          }}
        >
          <Field label={t("label")} onChange={(event) => setLabel(event.target.value)} required value={label} />
          <SelectField label={t("store")} onChange={(event) => setLocationId(event.target.value)} value={locationId}>
            {locations.map((row) => (
              <option key={row.id} value={row.id}>{row.name}</option>
            ))}
          </SelectField>
          <Button disabled={!label || !locationId} type="submit">{t("bind")}</Button>
        </form>
        {credential ? <p className="mt-3 break-all font-mono text-xs">{t("credential")}: {credential}</p> : null}
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(undefined);
            try {
              await readJson("/api/registers/pin", {
                method: "POST",
                body: JSON.stringify({
                  deviceCredential: form.get("deviceCredential"),
                  membershipId: form.get("membershipId"),
                  pin: form.get("pin"),
                }),
              });
              router.push("/products");
            } catch (caught) {
              const code = caught instanceof Error ? caught.message : "unknown";
              setError(errors.has(code) ? errors(code) : errors("unknown"));
            }
          }}
        >
          <Field label={t("credential")} name="deviceCredential" required />
          <Field label={t("membership")} name="membershipId" required />
          <Field label={t("pin")} maxLength={6} name="pin" required />
          <Button type="submit">{t("pinLogin")}</Button>
        </form>
      </Panel>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li className="flex items-center justify-between rounded-panel border border-line bg-white px-4 py-3 text-sm" key={row.id}>
            <span>{row.label} · {row.status}</span>
            {row.status === "ACTIVE" ? (
              <Button
                onClick={async () => {
                  await readJson(`/api/registers/${row.id}/revoke`, { method: "POST" });
                  await load();
                }}
                type="button"
                variant="danger"
              >
                {t("revoke")}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
