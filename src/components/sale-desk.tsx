"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel, SelectField, Soon } from "@/components/ui";
import { useRouter } from "@/i18n/navigation";
import type { Schemas } from "@/lib/backend";
import { formatAmount } from "@/lib/money";
import { readJson } from "@/lib/read-json";

type Product = Schemas["ProductView"];
type Location = Schemas["LocationView"];
type Shift = Schemas["ShiftView"];

type Line = { productId: string; name: string; quantity: string; discount: string; price: string };

const methods = ["CASH", "KBZ_PAY", "WAVE_PAY", "AYA_PAY", "CB_PAY", "BANK_TRANSFER", "OTHER"] as const;

export function SaleDesk() {
  const t = useTranslations("sale");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locationId, setLocationId] = useState("");
  const [shift, setShift] = useState<Shift>();
  const [floatAmount, setFloatAmount] = useState("0");
  const [counted, setCounted] = useState("");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [cartDiscount, setCartDiscount] = useState("");
  const [method, setMethod] = useState<(typeof methods)[number]>("CASH");
  const [tendered, setTendered] = useState("");
  const [reference, setReference] = useState("");
  const [priceType, setPriceType] = useState<"RETAIL" | "WHOLESALE">("RETAIL");
  const [error, setError] = useState<string>();
  const [key] = useState(() => crypto.randomUUID());

  const stores = locations.filter((row) => row.type === "STORE" && row.active !== false);

  useEffect(() => {
    void readJson<Location[]>("/api/org/locations").then((rows) => {
      setLocations(rows);
      const store = rows.find((row) => row.type === "STORE" && row.active !== false);
      if (store?.id) {
        setLocationId(store.id);
      }
    });
    void readJson<Product[]>("/api/catalog/products").then(setProducts);
  }, []);

  useEffect(() => {
    if (!locationId) {
      return;
    }
    void readJson<Shift>(`/api/sales/shifts?locationId=${locationId}`)
      .then(setShift)
      .catch(() => setShift(undefined));
  }, [locationId]);

  const visible = products.filter((product) => {
    const needle = query.trim().toLowerCase();
    return product.active !== false && product.sellInPos !== false && (!needle || `${product.name} ${product.sku}`.toLowerCase().includes(needle));
  });

  function add(product: Product) {
    if (!product.id) {
      return;
    }
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) => line.productId === product.id ? { ...line, quantity: String(Number(line.quantity) + 1) } : line);
      }
      const price = priceType === "WHOLESALE" && product.wholesalePrice != null ? product.wholesalePrice : product.retailPrice;
      return [...current, { productId: product.id!, name: product.name ?? "", quantity: "1", discount: "", price: String(price ?? "") }];
    });
  }

  async function checkout() {
    setError(undefined);
    if (!shift?.id) {
      setError(t("needShift"));
      return;
    }
    try {
      const sale = await readJson<Schemas["SaleView"]>("/api/sales/checkout", {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: key,
          locationId,
          channel: "POS",
          cashierShiftId: shift.id,
          priceType,
          cartDiscountAmount: cartDiscount || undefined,
          lines: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            discountAmount: line.discount || undefined,
          })),
          payments: [
            {
              method,
              amount: tendered || "0",
              tenderedAmount: method === "CASH" ? tendered || undefined : undefined,
              referenceNo: reference || undefined,
            },
          ],
        }),
      });
      router.push(`/sales/${sale.id}`);
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "unknown";
      setError(errors.has(code) ? errors(code) : errors("unknown"));
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel title={t("items")}>
          <div className="mb-3 flex flex-wrap gap-2">
            <SelectField label={t("store")} onChange={(event) => setLocationId(event.target.value)} value={locationId}>
              {stores.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </SelectField>
            <SelectField label={t("priceType")} onChange={(event) => setPriceType(event.target.value as typeof priceType)} value={priceType}>
              <option value="RETAIL">RETAIL</option>
              <option value="WHOLESALE">WHOLESALE</option>
            </SelectField>
          </div>
          {shift?.status === "OPEN" ? (
            <form
              className="mb-3 flex flex-wrap items-end gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                await readJson(`/api/sales/shifts/${shift.id}/close`, {
                  method: "POST",
                  body: JSON.stringify({ countedCash: counted || "0" }),
                });
                setShift(undefined);
              }}
            >
              <Field label={t("counted")} onChange={(event) => setCounted(event.target.value)} value={counted} />
              <Button type="submit" variant="secondary">{t("closeShift")}</Button>
            </form>
          ) : (
            <form
              className="mb-3 flex flex-wrap items-end gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                const opened = await readJson<Shift>("/api/sales/shifts", {
                  method: "POST",
                  body: JSON.stringify({ locationId, openingFloat: floatAmount || "0" }),
                });
                setShift(opened);
              }}
            >
              <Field label={t("float")} onChange={(event) => setFloatAmount(event.target.value)} value={floatAmount} />
              <Button disabled={!locationId} type="submit">{t("openShift")}</Button>
            </form>
          )}
          <input
            className="mb-3 w-full rounded-control border border-line px-3 py-2 text-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search")}
            value={query}
          />
          <ul className="flex max-h-64 flex-col gap-1 overflow-auto">
            {visible.slice(0, 20).map((product) => (
              <li key={product.id}>
                <button className="w-full rounded-button px-2 py-2 text-left text-sm hover:bg-indigo/5" onClick={() => add(product)} type="button">
                  <span className="font-semibold">{product.name}</span>
                  <span className="ml-2 font-mono text-slate">{formatAmount(priceType === "WHOLESALE" ? product.wholesalePrice ?? product.retailPrice : product.retailPrice)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={t("cart")}>
          <ul className="flex flex-col gap-2 text-sm">
            {lines.map((line) => (
              <li key={line.productId}>
                <p className="font-semibold">{line.name}</p>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <Field label={t("qty")} onChange={(event) => setLines((current) => current.map((row) => row.productId === line.productId ? { ...row, quantity: event.target.value } : row))} value={line.quantity} />
                  <Field label={t("lineDiscount")} onChange={(event) => setLines((current) => current.map((row) => row.productId === line.productId ? { ...row, discount: event.target.value } : row))} value={line.discount} />
                </div>
              </li>
            ))}
          </ul>
          <Field label={t("cartDiscount")} onChange={(event) => setCartDiscount(event.target.value)} value={cartDiscount} />
          <SelectField label={t("method")} onChange={(event) => setMethod(event.target.value as typeof method)} value={method}>
            {methods.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </SelectField>
          <Soon>{t("creditHidden")}</Soon>
          <Field label={method === "CASH" ? t("tendered") : t("amount")} onChange={(event) => setTendered(event.target.value)} value={tendered} />
          {method !== "CASH" ? <Field label={t("reference")} onChange={(event) => setReference(event.target.value)} value={reference} /> : null}
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
          <Button className="mt-3 w-full" disabled={lines.length === 0} onClick={() => void checkout()} type="button">{t("charge")}</Button>
          <Button
            className="mt-2 w-full"
            disabled={lines.length === 0}
            onClick={async () => {
              const parked = await readJson<Schemas["SaleView"]>("/api/sales", {
                method: "POST",
                body: JSON.stringify({
                  locationId,
                  channel: "POS",
                  cashierShiftId: shift?.id,
                  priceType,
                  cartDiscountAmount: cartDiscount || undefined,
                  hold: true,
                  lines: lines.map((line) => ({ productId: line.productId, quantity: line.quantity, discountAmount: line.discount || undefined })),
                }),
              });
              router.push(`/sales/${parked.id}`);
            }}
            type="button"
            variant="secondary"
          >
            {t("hold")}
          </Button>
          <p className="mt-2 text-xs text-slate">{t("heldNote")}</p>
        </Panel>
      </div>
    </div>
  );
}
