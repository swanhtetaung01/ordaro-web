"use client";

import { useEffect, useState } from "react";
import Decimal from "decimal.js";
import { useTranslations } from "next-intl";

import { Badge, PageHeader, Panel } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import type { Schemas } from "@/lib/backend";
import { formatAmount } from "@/lib/money";
import { messageFor, readJson } from "@/lib/read-json";
import { useMembershipRole } from "@/lib/role";

type Org = Schemas["OrganizationView"];
type Summary = Schemas["Summary"];
type Day = Schemas["DayTotal"];

type Reports = {
  today: Summary;
  month: Summary;
  days: Day[];
  top: Schemas["ProductTotal"][];
  low: Schemas["LowStockRow"][];
  mix: Schemas["PaymentMixRow"][];
};

/** YYYY-MM-DD in the shop's own timezone, whatever the phone's clock is set to. */
function localDate(timezone: string, date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(date);
}

function shiftDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function Dashboard() {
  const t = useTranslations("dashboard");
  const errors = useTranslations("errors");
  const { managesStock, ready } = useMembershipRole();
  const [org, setOrg] = useState<Org>();
  const [reports, setReports] = useState<Reports>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    void readJson<Org>("/api/catalog/organization").then(setOrg);
  }, []);

  useEffect(() => {
    if (!org?.timezone || !managesStock) {
      return;
    }
    const today = localDate(org.timezone);
    const monthStart = `${today.slice(0, 8)}01`;
    const twoWeeks = shiftDays(today, -13);
    const month = `from=${monthStart}&to=${today}`;
    Promise.all([
      readJson<Summary>(`/api/reports/summary?from=${today}&to=${today}`),
      readJson<Summary>(`/api/reports/summary?${month}`),
      readJson<Day[]>(`/api/reports/sales-by-day?from=${twoWeeks}&to=${today}`),
      readJson<Schemas["ProductTotal"][]>(`/api/reports/top-products?${month}&limit=5`),
      readJson<Schemas["LowStockRow"][]>("/api/reports/low-stock?limit=8"),
      readJson<Schemas["PaymentMixRow"][]>(`/api/reports/payment-mix?${month}`),
    ])
      .then(([todaySummary, monthSummary, days, top, low, mix]) =>
        setReports({ today: todaySummary, month: monthSummary, days, top, low, mix }))
      .catch((caught) => setError(messageFor(caught, errors, (code) => errors.has(code))));
  }, [org?.timezone, managesStock, errors]);

  if (!ready || !org) {
    return null;
  }
  const currency = org.currencyCode ?? "";

  if (!managesStock) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-8">
        <PageHeader title={t("title")} subtitle={org.name} />
        <Panel>
          <p className="text-sm">{t("cashierHint")}</p>
          <Link className="mt-3 inline-block rounded-button bg-indigo px-4 py-2.5 text-sm font-semibold text-white" href="/sales/new">
            {t("newSale")}
          </Link>
        </Panel>
      </div>
    );
  }

  const today = localDate(org.timezone ?? "Asia/Yangon");
  const series = Array.from({ length: 14 }, (_, index) => {
    const day = shiftDays(today, index - 13);
    const found = reports?.days.find((row) => row.day === day);
    return { day, sales: new Decimal(found?.grossSales ?? 0), count: found?.salesCount ?? 0 };
  });
  const peak = series.reduce((max, row) => Decimal.max(max, row.sales), new Decimal(0));
  const afterExpenses = reports
    ? new Decimal(reports.month.grossProfit ?? 0).minus(reports.month.expenses ?? 0)
    : undefined;

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader
        title={t("title")}
        subtitle={org.name}
        actions={
          <Link className="rounded-button bg-indigo px-4 py-2.5 text-sm font-semibold text-white" href="/sales/new">
            {t("newSale")}
          </Link>
        }
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {reports ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label={t("todaySales")} value={reports.today.grossSales} currency={currency}
              note={t("salesCount", { count: reports.today.salesCount ?? 0 })} />
            <Tile label={t("todayProfit")} value={reports.today.grossProfit} currency={currency} note={t("profitNote")} />
            <Tile label={t("monthSales")} value={reports.month.grossSales} currency={currency}
              note={t("salesCount", { count: reports.month.salesCount ?? 0 })} />
            <Tile label={t("monthProfit")} value={reports.month.grossProfit} currency={currency}
              note={t("afterExpenses", { amount: formatAmount(afterExpenses?.toString()) })} />
            <Tile label={t("monthExpenses")} value={reports.month.expenses} currency={currency} />
            <Tile label={t("monthRefunds")} value={reports.month.refundAmount} currency={currency}
              note={t("returnCount", { count: reports.month.returnCount ?? 0 })} />
            <Tile label={t("owedToYou")} value={reports.month.receivablesOutstanding} currency={currency}
              href="/receivables" note={t("owedToYouNote")} />
            <Tile label={t("youOwe")} value={reports.month.payablesOutstanding} currency={currency} href="/payables" />
          </div>

          <Panel title={t("lastTwoWeeks")}>
            <div className="flex h-40 items-end gap-1" role="img" aria-label={t("lastTwoWeeks")}>
              {series.map((row) => (
                <div className="flex h-full flex-1 flex-col items-center justify-end gap-1" key={row.day}
                  title={`${row.day}: ${formatAmount(row.sales.toString())} ${currency} · ${row.count}`}>
                  <div
                    className="w-full rounded-t bg-indigo/80"
                    style={{ height: peak.isZero() ? "2px" : `${Math.max(2, row.sales.div(peak).times(100).toNumber())}%` }}
                  />
                  <span className="text-[10px] text-slate">{row.day.slice(8)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title={t("topProducts")}>
              {reports.top.length === 0 ? <p className="text-sm text-slate">{t("nothingYet")}</p> : (
                <ul className="flex flex-col gap-2 text-sm">
                  {reports.top.map((row) => (
                    <li className="flex justify-between gap-2" key={row.productId}>
                      <span>{row.productName} <span className="text-slate">× {formatAmount(row.quantity)}</span></span>
                      <span className="text-right font-mono">
                        {formatAmount(row.netRevenue)}
                        <span className="block text-xs text-teal">+{formatAmount(row.grossProfit)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title={t("lowStock")}>
              {reports.low.length === 0 ? <p className="text-sm text-slate">{t("stockFine")}</p> : (
                <ul className="flex flex-col gap-2 text-sm">
                  {reports.low.map((row) => (
                    <li className="flex justify-between gap-2" key={`${row.productId}-${row.locationId}`}>
                      <span>{row.productName} <span className="text-slate">{row.locationCode}</span></span>
                      <Badge tone={new Decimal(row.quantity ?? 0).lte(0) ? "bad" : "warn"}>
                        {formatAmount(row.quantity)} / {row.reorderPoint}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title={t("paymentMix")}>
              {reports.mix.length === 0 ? <p className="text-sm text-slate">{t("nothingYet")}</p> : (
                <ul className="flex flex-col gap-2 text-sm">
                  {reports.mix.map((row) => (
                    <li className="flex justify-between gap-2" key={row.method}>
                      <span>{row.method} <span className="text-slate">× {row.count}</span></span>
                      <span className="font-mono">{formatAmount(row.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Tile({ label, value, currency, note, href }: {
  label: string;
  value?: number | string;
  currency: string;
  note?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold">
        {formatAmount(value)} <span className="text-sm font-normal text-slate">{currency}</span>
      </p>
      {note ? <p className="mt-1 text-xs text-slate">{note}</p> : null}
    </>
  );
  return href ? (
    <Link className="rounded-panel border border-line bg-white p-4 hover:border-indigo" href={href}>{body}</Link>
  ) : (
    <div className="rounded-panel border border-line bg-white p-4">{body}</div>
  );
}
