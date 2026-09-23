"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge, Button, Field, PageHeader, Panel, SelectField } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import type { Schemas } from "@/lib/backend";
import { formatAmount } from "@/lib/money";
import { messageFor, readJson } from "@/lib/read-json";

type Row = Schemas["SaleSummaryView"];

const done = ["COMPLETED", "PARTIALLY_REFUNDED", "REFUNDED"];
const parked = ["HELD", "DRAFT"];

/** The sales log (completed sales, newest first) or, with {@code held}, the parked carts. */
export function SalesLog({ held = false }: { held?: boolean }) {
  const t = useTranslations("salesLog");
  const errors = useTranslations("errors");
  const [rows, setRows] = useState<Row[]>([]);
  const [show, setShow] = useState<"done" | "all">("done");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState<string>();
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    const search = new URLSearchParams();
    for (const status of held ? parked : show === "done" ? done : []) {
      search.append("status", status);
    }
    if (from) {
      search.set("from", from);
    }
    if (to) {
      search.set("to", to);
    }
    search.set("limit", "200");
    // state changes only once the answer is in, never synchronously inside the effect
    return readJson<Row[]>(`/api/sales?${search}`)
      .then((found) => {
        setRows(found);
        setError(undefined);
      })
      .catch((caught) => setError(messageFor(caught, errors, (code) => errors.has(code))))
      .finally(() => setLoaded(true));
  }, [held, show, from, to, errors]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={held ? t("heldTitle") : t("title")} subtitle={held ? t("heldSubtitle") : t("subtitle")} />
      {held ? null : (
        <Panel>
          <form
            className="grid gap-3 sm:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              void load();
            }}
          >
            <SelectField label={t("show")} onChange={(event) => setShow(event.target.value as typeof show)} value={show}>
              <option value="done">{t("showDone")}</option>
              <option value="all">{t("showAll")}</option>
            </SelectField>
            <Field label={t("from")} onChange={(event) => setFrom(event.target.value)} type="date" value={from} />
            <Field label={t("to")} onChange={(event) => setTo(event.target.value)} type="date" value={to} />
            <Button className="self-end" type="submit" variant="secondary">{t("refresh")}</Button>
          </form>
          <p className="mt-2 text-xs text-slate">{t("rangeHint")}</p>
        </Panel>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loaded && rows.length === 0 && !error ? <p className="text-sm text-slate">{held ? t("noHeld") : t("none")}</p> : null}
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              className="flex flex-wrap items-center justify-between gap-2 rounded-panel border border-line bg-white px-4 py-3 text-sm hover:border-indigo"
              href={`/sales/${row.id}`}
            >
              <span className="flex flex-col">
                <span className="font-semibold">{row.receiptNumber ?? t("parked")}</span>
                <span className="text-xs text-slate">
                  {new Date((row.soldAt ?? row.createdAt) as string).toLocaleString()} · {row.customerName ?? t("walkIn")}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Badge tone={row.channel === "ONLINE" ? "ok" : "muted"}>{row.channel === "ONLINE" ? t("online") : t("inShop")}</Badge>
                {row.status !== "COMPLETED" ? <Badge tone={row.status === "HELD" || row.status === "DRAFT" ? "warn" : "muted"}>{row.status}</Badge> : null}
                <span className="text-xs text-slate">{t("items", { count: row.lineCount ?? 0 })}</span>
                <span className="font-mono font-semibold">{formatAmount(row.total)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
