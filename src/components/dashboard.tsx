"use client";

import { useEffect, useState } from "react";
import Decimal from "decimal.js";
import { useTranslations } from "next-intl";

import { ArrowRightIcon, PlusIcon } from "@/components/icons";
import { Alert, Badge, ButtonLink, focusRing, Page, PageHeader, Panel, Skeleton } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import type { Schemas } from "@/lib/backend";
import { useCodes } from "@/lib/codes";
import { formatAmount, formatQuantity } from "@/lib/money";
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
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const codes = useCodes();
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

  const newSale = (
    <ButtonLink href="/sales/new">
      <PlusIcon className="size-5" />
      {t("newSale")}
    </ButtonLink>
  );

  if (!ready || !org) {
    return (
      <Page>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48 rounded-button" />
          <Skeleton className="h-4 w-32 rounded-button" />
        </div>
        <TilesLoading label={common("loading")} />
      </Page>
    );
  }
  const currency = org.currencyCode ?? "";

  if (!managesStock) {
    return (
      <Page>
        <PageHeader subtitle={org.name} title={t("title")} />
        <Panel>
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-ink">{t("cashierHint")}</p>
            {newSale}
          </div>
        </Panel>
      </Page>
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
    <Page>
      <PageHeader actions={newSale} subtitle={org.name} title={t("title")} />
      {error ? <Alert>{error}</Alert> : null}
      {reports ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
            <div aria-label={t("lastTwoWeeks")} className="flex h-40 items-end gap-1 sm:gap-2" role="img">
              {series.map((row) => (
                <div className="flex h-full min-w-0 flex-1 flex-col items-center gap-2" key={row.day}
                  title={`${row.day}: ${formatAmount(row.sales.toString())} ${currency} · ${row.count}`}>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-sm bg-indigo/80 transition-colors hover:bg-indigo motion-reduce:transition-none"
                      style={{ height: peak.isZero() ? "2px" : `${Math.max(2, row.sales.div(peak).times(100).toNumber())}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate tabular-nums">{row.day.slice(8)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel title={t("topProducts")}>
              {reports.top.length === 0 ? <p className="text-sm text-slate">{t("nothingYet")}</p> : (
                <ul className="flex flex-col divide-y divide-line text-sm">
                  {reports.top.map((row) => (
                    <li className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0" key={row.productId}>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{row.productName}</span>
                        <span className="block text-xs text-slate tabular-nums">× {formatQuantity(row.quantity)}</span>
                      </span>
                      <span className="text-right tabular-nums">
                        <span className="block font-semibold text-ink">{formatAmount(row.netRevenue)}</span>
                        <span className="block text-xs font-medium text-teal">+{formatAmount(row.grossProfit)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title={t("lowStock")}>
              {reports.low.length === 0 ? <p className="text-sm text-slate">{t("stockFine")}</p> : (
                <ul className="flex flex-col divide-y divide-line text-sm">
                  {reports.low.map((row) => (
                    <li className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0" key={`${row.productId}-${row.locationId}`}>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{row.productName}</span>
                        <span className="block text-xs text-slate">{row.locationCode}</span>
                      </span>
                      <Badge tone={new Decimal(row.quantity ?? 0).lte(0) ? "bad" : "warn"}>
                        {formatQuantity(row.quantity)} / {row.reorderPoint}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title={t("paymentMix")}>
              {reports.mix.length === 0 ? <p className="text-sm text-slate">{t("nothingYet")}</p> : (
                <ul className="flex flex-col divide-y divide-line text-sm">
                  {reports.mix.map((row) => (
                    <li className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0" key={row.method}>
                      <span className="min-w-0">
                        <span className="font-medium text-ink">{codes("method", row.method)}</span>{" "}
                        <span className="text-slate tabular-nums">× {row.count}</span>
                      </span>
                      <span className="font-semibold text-ink tabular-nums">{formatAmount(row.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      ) : error ? null : (
        <TilesLoading label={common("loading")} />
      )}
    </Page>
  );
}

function TilesLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-6" role="status">
      <span className="sr-only">{label}</span>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton className="h-28 rounded-panel" key={index} />
        ))}
      </div>
      <Skeleton className="h-56 rounded-panel" />
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
      <p className="flex items-start justify-between gap-2 text-sm font-medium text-slate">
        {label}
        {href ? (
          <ArrowRightIcon className="mt-0.5 size-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:text-indigo motion-reduce:transition-none" />
        ) : null}
      </p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-1">
        <span className="text-xl font-bold text-ink tabular-nums sm:text-2xl">{formatAmount(value)}</span>
        <span className="text-xs font-medium text-slate">{currency}</span>
      </p>
      {note ? <p className="mt-2 text-xs text-slate">{note}</p> : null}
    </>
  );
  const box = "flex min-w-0 flex-col rounded-panel border border-line bg-white p-4 shadow-xs sm:p-6";
  return href ? (
    <Link
      className={`${box} group transition hover:border-indigo/40 hover:shadow-md motion-reduce:transition-none ${focusRing}`}
      href={href}
    >
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}
