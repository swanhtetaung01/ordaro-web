"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { ChevronDownIcon, PlusIcon } from "@/components/icons";
import {
  Alert,
  Badge,
  Button,
  ConfirmButton,
  EmptyState,
  Field,
  focusRing,
  LoadingRows,
  Modal,
  Page,
  PageHeader,
  Panel,
  SelectField,
} from "@/components/ui";
import { useRouter } from "@/i18n/navigation";
import type { Schemas } from "@/lib/backend";
import { useCodes } from "@/lib/codes";
import { messageFor, readJson } from "@/lib/read-json";

type Register = Schemas["RegisterView"];
type Location = Schemas["LocationView"];

export function RegisterManager() {
  const t = useTranslations("registers");
  const errors = useTranslations("errors");
  const codes = useCodes();
  const router = useRouter();
  const [rows, setRows] = useState<Register[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [label, setLabel] = useState("");
  const [credential, setCredential] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();

  function load() {
    return readJson<Register[]>("/api/registers").then(setRows);
  }

  useEffect(() => {
    void readJson<Register[]>("/api/registers")
      .then(setRows)
      .catch((caught) => setError(messageFor(caught, errors, (code) => errors.has(code))))
      .finally(() => setLoaded(true));
    void readJson<Location[]>("/api/org/locations").then((next) => {
      const stores = next.filter((row) => row.type === "STORE");
      setLocations(stores);
      if (stores[0]?.id) {
        setLocationId(stores[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- translator identity is not a reload
  }, []);

  function fail(caught: unknown, inDialog: boolean) {
    const message = messageFor(caught, errors, (code) => errors.has(code));
    if (inDialog) {
      setFormError(message);
    } else {
      setError(message);
    }
  }

  async function bind(event: React.FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    setBusy("bind");
    try {
      const bound = await readJson<Schemas["BoundView"]>("/api/registers", {
        method: "POST",
        body: JSON.stringify({ locationId, label }),
      });
      setCredential(bound.deviceCredential);
      setCopied(false);
      setLabel("");
      await load();
    } catch (caught) {
      fail(caught, true);
    } finally {
      setBusy(undefined);
    }
  }

  async function revoke(row: Register) {
    setError(undefined);
    setBusy(row.id);
    try {
      await readJson(`/api/registers/${row.id}/revoke`, { method: "POST" });
      await load();
    } catch (caught) {
      fail(caught, false);
    } finally {
      setBusy(undefined);
    }
  }

  async function pinSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(undefined);
    setBusy("pin");
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
      fail(caught, false);
      setBusy(undefined);
    }
  }

  const store = (id?: string) => locations.find((row) => row.id === id)?.name ?? "—";
  const openAdd = () => {
    setFormError(undefined);
    setCredential(undefined);
    setAdding(true);
  };

  return (
    <Page>
      <PageHeader
        actions={
          <Button onClick={openAdd} type="button">
            <PlusIcon className="size-5" />
            {t("bind")}
          </Button>
        }
        subtitle={t("subtitle")}
        title={t("title")}
      />
      {error ? <Alert>{error}</Alert> : null}

      {!loaded ? (
        <LoadingRows rows={2} />
      ) : rows.length === 0 ? (
        error ? null : (
          <EmptyState
            action={
              <Button onClick={openAdd} type="button" variant="secondary">
                <PlusIcon className="size-5" />
                {t("bind")}
              </Button>
            }
            hint={t("emptyHint")}
            title={t("empty")}
          />
        )
      ) : (
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-panel border border-line bg-white shadow-xs">
          {rows.map((row) => (
            <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4" key={row.id}>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{row.label}</span>
                  <Badge tone={row.status === "ACTIVE" ? "ok" : "muted"}>{codes("registerStatus", row.status)}</Badge>
                </span>
                <span className="block text-xs text-slate">
                  {[store(row.locationId), row.lastSeenAt ? t("lastSeen", { date: new Date(row.lastSeenAt).toLocaleDateString() }) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              {row.status === "ACTIVE" ? (
                <div className="ml-auto">
                  <ConfirmButton
                    busy={busy === row.id}
                    confirmLabel={t("revokeConfirm")}
                    label={t("revoke")}
                    onConfirm={() => void revoke(row)}
                    question={t("revokeQuestion", { name: row.label ?? "" })}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Panel>
        <details className="group">
          <summary
            className={`-m-2 flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-button p-2 text-base font-semibold text-ink hover:bg-slate-50 sm:min-h-10 [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            {t("pinLogin")}
            <ChevronDownIcon className="size-4 text-slate transition group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <p className="mt-4 text-sm text-slate">{t("pinLoginHint")}</p>
          <form className="mt-4 grid gap-4 sm:grid-cols-3 sm:items-end" onSubmit={(event) => void pinSignIn(event)}>
            <Field label={t("credential")} name="deviceCredential" required />
            <Field label={t("membership")} name="membershipId" required />
            <Field inputMode="numeric" label={t("pin")} maxLength={6} name="pin" required type="password" />
            <Button busy={busy === "pin"} className="sm:col-span-3 sm:justify-self-start" type="submit">
              {t("pinLogin")}
            </Button>
          </form>
        </details>
      </Panel>

      <Modal onClose={() => setAdding(false)} open={adding} title={t("bindTitle")}>
        {credential ? (
          <div className="flex flex-col gap-4">
            <Alert tone="success">{t("bound")}</Alert>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-ink">{t("credential")}</p>
              <p className="rounded-button border border-line bg-surface px-4 py-2 font-mono text-sm break-all">{credential}</p>
              <p className="text-xs text-slate">{t("credentialHint")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  void navigator.clipboard?.writeText(credential).then(() => setCopied(true));
                }}
                type="button"
                variant="secondary"
              >
                {copied ? t("copied") : t("copy")}
              </Button>
              <Button onClick={() => setAdding(false)} type="button">{t("done")}</Button>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(event) => void bind(event)}>
            <Field hint={t("labelHint")} label={t("label")} onChange={(event) => setLabel(event.target.value)} required value={label} />
            <SelectField label={t("store")} onChange={(event) => setLocationId(event.target.value)} value={locationId}>
              {locations.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </SelectField>
            {formError ? <Alert>{formError}</Alert> : null}
            <Button busy={busy === "bind"} className="self-start" disabled={!label || !locationId} type="submit">
              {t("bind")}
            </Button>
          </form>
        )}
      </Modal>
    </Page>
  );
}
