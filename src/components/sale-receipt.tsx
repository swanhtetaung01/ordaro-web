"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { PageHeader, Panel } from "@/components/ui";
import type { Schemas } from "@/lib/backend";
import { formatAmount } from "@/lib/money";
import { readJson } from "@/lib/read-json";

export function SaleReceipt({ saleId }: { saleId: string }) {
  const t = useTranslations("receipt");
  const [sale, setSale] = useState<Schemas["SaleView"]>();

  useEffect(() => {
    void readJson<Schemas["SaleView"]>(`/api/sales/${saleId}`).then(setSale);
  }, [saleId]);

  if (!sale) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={sale.receiptNumber ?? t("parked")} subtitle={sale.status} />
      <Panel>
        <ul className="flex flex-col gap-2 text-sm">
          {sale.lines?.map((line) => {
            const row = line as Schemas["LineView"] & { productName?: string; lineTotal?: number };
            return (
            <li className="flex justify-between" key={row.position}>
              <span>{row.productName ?? row.productId} × {row.quantity}</span>
              <span className="font-mono">{formatAmount(row.lineTotal)}</span>
            </li>
            );
          })}
        </ul>
        <p className="mt-4 font-mono text-lg font-bold">{t("total")} {formatAmount(sale.total)}</p>
        <p className="text-sm text-slate">{t("tax")} {formatAmount(sale.taxAmount)} · {t("paid")} {formatAmount(sale.paidAmount)}</p>
        {sale.payments?.map((payment, index) => (
          <p className="text-sm" key={index}>{payment.method} {formatAmount(payment.amount)} {payment.changeAmount ? `${t("change")} ${formatAmount(payment.changeAmount)}` : ""}</p>
        ))}
      </Panel>
    </div>
  );
}
