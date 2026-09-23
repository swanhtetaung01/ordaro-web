"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel, SelectField } from "@/components/ui";
import type { Schemas } from "@/lib/backend";
import { readJson } from "@/lib/read-json";

type Member = Schemas["MembershipView"];
type Location = Schemas["LocationView"];

export function StaffManager() {
  const t = useTranslations("staff");
  const errors = useTranslations("errors");
  const [rows, setRows] = useState<Member[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<Schemas["InviteRequest"]["role"]>("CASHIER");
  const [pin, setPin] = useState("");
  const [code, setCode] = useState<string>();
  const [error, setError] = useState<string>();
  const [pinFor, setPinFor] = useState<string>();
  const [newPin, setNewPin] = useState("");
  const [notice, setNotice] = useState<string>();

  function load() {
    return readJson<Member[]>("/api/org/memberships").then(setRows);
  }

  useEffect(() => {
    void readJson<Member[]>("/api/org/memberships").then(setRows);
    void readJson<Location[]>("/api/org/locations").then(setLocations);
  }, []);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Panel title={t("invite")}>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(undefined);
            try {
              const created = await readJson<Schemas["InviteResponse"]>("/api/org/memberships", {
                method: "POST",
                body: JSON.stringify({ displayName, role, pin: pin || undefined }),
              });
              setCode(created.inviteCode);
              setDisplayName("");
              setPin("");
              await load();
            } catch (caught) {
              const name = caught instanceof Error ? caught.message : "unknown";
              setError(errors.has(name) ? errors(name) : errors("unknown"));
            }
          }}
        >
          <Field label={t("name")} onChange={(event) => setDisplayName(event.target.value)} required value={displayName} />
          <SelectField label={t("role")} onChange={(event) => setRole(event.target.value as typeof role)} value={role}>
            {["CASHIER", "STOCK_MANAGER", "PACKER", "OWNER"].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </SelectField>
          <Field label={t("pin")} hint={t("pinHint")} maxLength={6} onChange={(event) => setPin(event.target.value)} value={pin} />
          <Button disabled={!displayName} type="submit">{t("add")}</Button>
        </form>
        {code ? <p className="mt-3 font-mono text-sm">{t("code")}: {code}</p> : null}
      </Panel>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {notice ? <p className="text-sm text-teal">{notice}</p> : null}
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li className="rounded-panel border border-line bg-white px-4 py-3 text-sm" key={row.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{row.displayName}</span>
              <span className="text-slate">{row.role}</span>
              <span className="text-slate">{row.status}</span>
              <span className="text-slate">{locations.find((location) => location.id === row.locationId)?.name}</span>
              {row.status !== "REMOVED" ? (
                <button className="ml-auto font-semibold text-indigo" onClick={() => { setPinFor(pinFor === row.id ? undefined : row.id); setNewPin(""); }} type="button">
                  {t("setPin")}
                </button>
              ) : null}
            </div>
            {pinFor === row.id ? (
              <form
                className="mt-3 flex flex-wrap items-end gap-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setError(undefined);
                  setNotice(undefined);
                  try {
                    await readJson(`/api/org/memberships/${row.id}/pin`, { method: "PUT", body: JSON.stringify({ pin: newPin }) });
                    setNotice(t("pinSaved", { name: row.displayName ?? "" }));
                    setPinFor(undefined);
                  } catch (caught) {
                    const name = caught instanceof Error ? caught.message : "unknown";
                    setError(errors.has(name) ? errors(name) : errors("unknown"));
                  }
                }}
              >
                <Field inputMode="numeric" label={t("newPin")} maxLength={6} onChange={(event) => setNewPin(event.target.value)} pattern={"\\d{6}"} required value={newPin} />
                <Button type="submit">{t("savePin")}</Button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
