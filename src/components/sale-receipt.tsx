"use client";

import { useEffect, useState } from "react";
import Decimal from "decimal.js";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel, SelectField } from "@/components/ui";
import { useRouter } from "@/i18n/navigation";
import type { Schemas } from "@/lib/backend";
import { formatAmount } from "@/lib/money";
import { messageFor, readJson, readResponse } from "@/lib/read-json";

type SaleLine = {
  id?: string;
  position?: number;
  productId?: string;
  productName?: string;
  quantity?: number | string;
  lineTotal?: number | string;
};

const refundMethods = ["CASH", "KBZ_PAY", "WAVE_PAY", "AYA_PAY", "CB_PAY", "BANK_TRANSFER", "OTHER", "CREDIT"] as const;
const payMethods = ["CASH", "KBZ_PAY", "WAVE_PAY", "AYA_PAY", "CB_PAY", "BANK_TRANSFER", "OTHER", "CREDIT"] as const;

export function SaleReceipt({ saleId }: { saleId: string }) {
  const t = useTranslations("receipt");
  const errors = useTranslations("errors");
  const [sale, setSale] = useState<Schemas["SaleView"]>();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [restock, setRestock] = useState<Record<string, boolean>>({});
  const [method, setMethod] = useState<(typeof refundMethods)[number]>("CASH");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [payMethod, setPayMethod] = useState<(typeof payMethods)[number]>("CASH");
  const [payReference, setPayReference] = useState("");
  const [completionKey] = useState(() => crypto.randomUUID());
  const router = useRouter();

  useEffect(() => {
    void readJson<Schemas["SaleView"]>(`/api/sales/${saleId}`).then(setSale);
  }, [saleId]);

  if (!sale) {
    return null;
  }

  const lines = (sale.lines ?? []) as SaleLine[];
  const creditSale = (sale.payments ?? []).some((payment) => payment.method === "CREDIT")
    || (sale.dueAmount != null && new Decimal(sale.dueAmount).gt(0));
  const returnable = sale.status === "COMPLETED" || sale.status === "PARTIALLY_REFUNDED";
  const parked = sale.status === "HELD" || sale.status === "DRAFT";
  const when = sale.soldAt ? new Date(sale.soldAt).toLocaleString() : undefined;

  /** Charge a held cart for its whole total with one payment. */
  async function completeCart(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    try {
      const done = await readJson<Schemas["SaleView"]>(`/api/sales/${saleId}/complete`, {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: completionKey,
          payments: [{
            method: payMethod,
            amount: String(sale?.total ?? "0"),
            tenderedAmount: payMethod === "CASH" ? String(sale?.total ?? "0") : undefined,
            referenceNo: payReference || undefined,
          }],
        }),
      });
      setSale(done);
    } catch (caught) {
      setError(messageFor(caught, errors, (code) => errors.has(code)));
    }
  }

  async function voidCart() {
    setError(undefined);
    try {
      await readJson(`/api/sales/${saleId}/void`, { method: "POST" });
      router.push("/sales/held");
    } catch (caught) {
      setError(messageFor(caught, errors, (code) => errors.has(code)));
    }
  }
  const methods = refundMethods.filter((value) => value !== "CREDIT" || creditSale);

  async function submitReturn(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    setNotice(undefined);
    const chosen = lines
      .filter((line) => line.id && quantities[line.id])
      .map((line) => ({
        saleLineId: line.id,
        quantity: quantities[line.id!],
        restock: restock[line.id!] !== false,
      }));
    if (chosen.length === 0 || !sale?.locationId) {
      return;
    }
    let cashierShiftId: string | undefined;
    if (method === "CASH") {
      try {
        const shift = await readJson<Schemas["ShiftView"]>(`/api/sales/shifts?locationId=${sale.locationId}`);
        cashierShiftId = shift.status === "OPEN" ? shift.id : undefined;
      } catch {
        cashierShiftId = undefined;
      }
    }
    try {
      const result = await readResponse<Schemas["ReturnView"]>("/api/returns", {
        method: "POST",
        body: JSON.stringify({
          saleId: sale.id,
          locationId: sale.locationId,
          cashierShiftId,
          refundMethod: method,
          referenceNo: reference || undefined,
          reason: reason || undefined,
          lines: chosen,
          idempotencyKey: key,
        }),
      });
      setNotice(result.replayed ? t("replayed") : result.data.returnNumber ?? t("returned"));
      setKey(crypto.randomUUID());
      setSale(await readJson<Schemas["SaleView"]>(`/api/sales/${saleId}`));
    } catch (caught) {
      setError(messageFor(caught, errors, (code) => errors.has(code)));
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader
        title={sale.receiptNumber ?? t("parked")}
        subtitle={[sale.status, sale.channel === "ONLINE" ? t("online") : t("inShop"), when].filter(Boolean).join(" · ")}
      />
      <Panel>
        {sale.customerId ? <p className="mb-3 text-sm">{t("customer")} {sale.customerName ?? sale.customerId}</p> : <p className="mb-3 text-sm text-slate">{t("walkIn")}</p>}
        <ul className="flex flex-col gap-2 text-sm">
          {lines.map((line) => (
            <li className="flex justify-between" key={line.id ?? line.position}>
              <span>{line.productName ?? line.productId} × {line.quantity}</span>
              <span className="font-mono">{formatAmount(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-mono text-lg font-bold">{t("total")} {formatAmount(sale.total)}</p>
        <p className="text-sm text-slate">{t("tax")} {formatAmount(sale.taxAmount)} · {t("paid")} {formatAmount(sale.paidAmount)} · {t("due")} {formatAmount(sale.dueAmount)}</p>
        {sale.payments?.map((payment, index) => (
          <p className="text-sm" key={index}>{payment.method} {formatAmount(payment.amount)} {payment.changeAmount ? `${t("change")} ${formatAmount(payment.changeAmount)}` : ""}</p>
        ))}
      </Panel>
      {parked ? (
        <Panel title={t("chargeCart")}>
          <form className="flex flex-col gap-3" onSubmit={(event) => void completeCart(event)}>
            <p className="text-sm text-slate">{t("chargeHint")}</p>
            <SelectField label={t("payMethod")} onChange={(event) => setPayMethod(event.target.value as typeof payMethod)} value={payMethod}>
              {payMethods.filter((value) => value !== "CREDIT" || sale.customerId).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </SelectField>
            {payMethod !== "CASH" && payMethod !== "CREDIT" ? (
              <Field label={t("reference")} onChange={(event) => setPayReference(event.target.value)} value={payReference} />
            ) : null}
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit">{t("charge", { total: formatAmount(sale.total) })}</Button>
            <Button onClick={() => void voidCart()} type="button" variant="danger">{t("voidCart")}</Button>
          </form>
        </Panel>
      ) : null}
      {returnable ? (
        <Panel title={t("returnTitle")}>
          <form className="flex flex-col gap-3" onSubmit={(event) => void submitReturn(event)}>
            {lines.map((line) => line.id ? (
              <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]" key={line.id}>
                <p className="text-sm font-semibold">{line.productName ?? line.productId}</p>
                <Field label={t("returnQty")} onChange={(event) => setQuantities({ ...quantities, [line.id!]: event.target.value })} value={quantities[line.id] ?? ""} />
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input checked={restock[line.id] !== false} onChange={(event) => setRestock({ ...restock, [line.id!]: event.target.checked })} type="checkbox" />
                  {t("restock")}
                </label>
              </div>
            ) : null)}
            <SelectField label={t("refundMethod")} onChange={(event) => setMethod(event.target.value as typeof method)} value={method}>
              {methods.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </SelectField>
            <Field label={t("reason")} onChange={(event) => setReason(event.target.value)} value={reason} />
            <Field label={t("reference")} onChange={(event) => setReference(event.target.value)} value={reference} />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            {notice ? <p className="text-sm text-teal">{notice}</p> : null}
            <Button type="submit">{t("submitReturn")}</Button>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
