"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel, SelectField, Soon } from "@/components/ui";
import { useRouter } from "@/i18n/navigation";
import type { Schemas } from "@/lib/backend";
import { formatAmount, addQuantities } from "@/lib/money";
import { messageFor, readJson } from "@/lib/read-json";

type Product = Schemas["ProductView"];
type Location = Schemas["LocationView"];
type Shift = Schemas["ShiftView"];
type Customer = Schemas["CustomerView"];
type Method = Schemas["PaymentRequest"]["method"];

type Line = { productId: string; name: string; quantity: string; discount: string };
type Tender = { method: Method; amount: string; reference: string };

const cashMethods = ["CASH", "KBZ_PAY", "WAVE_PAY", "AYA_PAY", "CB_PAY", "BANK_TRANSFER", "OTHER"] as const;

export function SaleDesk() {
  const t = useTranslations("sale");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locationId, setLocationId] = useState("");
  const [shift, setShift] = useState<Shift>();
  const [drawer, setDrawer] = useState<Schemas["Drawer"]>();
  const [floatAmount, setFloatAmount] = useState("0");
  const [counted, setCounted] = useState("");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [cartDiscount, setCartDiscount] = useState("");
  const [tenders, setTenders] = useState<Tender[]>([{ method: "CASH", amount: "", reference: "" }]);
  const [priceChoice, setPriceChoice] = useState<"" | "RETAIL" | "WHOLESALE">("RETAIL");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer>();
  const [error, setError] = useState<string>();
  const [key] = useState(() => crypto.randomUUID());

  const stores = locations.filter((row) => row.type === "STORE" && row.active !== false);
  const methods: Method[] = customer ? [...cashMethods, "CREDIT"] : [...cashMethods];

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
      .catch(() => {
        setShift(undefined);
        setDrawer(undefined);
      });
  }, [locationId]);

  useEffect(() => {
    if (!shift?.id || shift.status !== "OPEN") {
      return;
    }
    void readJson<Schemas["Drawer"]>(`/api/sales/shifts/${shift.id}/drawer`).then(setDrawer);
  }, [shift?.id, shift?.status]);

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
        return current.map((line) => line.productId === product.id ? { ...line, quantity: addQuantities([line.quantity, "1"]) } : line);
      }
      return [...current, { productId: product.id!, name: product.name ?? "", quantity: "1", discount: "" }];
    });
  }

  function cartBody() {
    return {
      locationId,
      channel: "POS",
      cashierShiftId: shift?.id,
      customerId: customer?.id,
      priceType: priceChoice || undefined,
      cartDiscountAmount: cartDiscount || undefined,
      lines: lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        discountAmount: line.discount || undefined,
      })),
    };
  }

  function payments() {
    return tenders.map((tender) => ({
      method: tender.method,
      amount: tender.amount || "0",
      tenderedAmount: tender.method === "CASH" ? tender.amount || undefined : undefined,
      referenceNo: tender.reference || undefined,
    }));
  }

  async function checkout() {
    setError(undefined);
    if (!shift?.id) {
      setError(t("needShift"));
      return;
    }
    if (tenders.some((tender) => tender.method === "CREDIT") && !customer) {
      setError(errors("customer_required"));
      return;
    }
    try {
      const sale = await readJson<Schemas["SaleView"]>("/api/sales/checkout", {
        method: "POST",
        body: JSON.stringify({ idempotencyKey: key, ...cartBody(), payments: payments() }),
      });
      router.push(`/sales/${sale.id}`);
    } catch (caught) {
      setError(messageFor(caught, errors, (code) => errors.has(code)));
    }
  }

  function chooseCustomer(next: Customer) {
    setCustomer(next);
    setPriceChoice("");
    setCustomers([]);
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Panel title={t("items")}>
          <div className="mb-3 flex flex-wrap gap-2">
            <SelectField label={t("store")} onChange={(event) => setLocationId(event.target.value)} value={locationId}>
              {stores.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </SelectField>
            <SelectField
              label={t("priceType")}
              onChange={(event) => setPriceChoice(event.target.value as typeof priceChoice)}
              value={priceChoice}
            >
              {customer ? <option value="">{t("customerPrice", { price: customer.defaultPriceType ?? "RETAIL" })}</option> : null}
              <option value="RETAIL">RETAIL</option>
              <option value="WHOLESALE">WHOLESALE</option>
            </SelectField>
          </div>
          {customer && priceChoice === "" ? <p className="mb-3 text-sm text-slate">{t("priceFromCustomer")}</p> : null}
          {shift?.status === "OPEN" ? (
            <form
              className="mb-3 flex flex-col gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                await readJson(`/api/sales/shifts/${shift.id}/close`, {
                  method: "POST",
                  body: JSON.stringify({ countedCash: counted || "0" }),
                });
                setShift(undefined);
                setDrawer(undefined);
              }}
            >
              {drawer ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-sm">
                  <dt>{t("openingFloat")}</dt><dd>{formatAmount(drawer.openingFloat)}</dd>
                  <dt>{t("cashSales")}</dt><dd>{formatAmount(drawer.cashSales)}</dd>
                  <dt>{t("cashRepayments")}</dt><dd>{formatAmount(drawer.cashRepayments)}</dd>
                  <dt>{t("cashRefunds")}</dt><dd>{formatAmount(drawer.cashRefunds)}</dd>
                  <dt>{t("cashExpenses")}</dt><dd>{formatAmount(drawer.cashExpenses)}</dd>
                  <dt>{t("cashSupplierPayments")}</dt><dd>{formatAmount(drawer.cashSupplierPayments)}</dd>
                  <dt className="font-bold">{t("expectedCash")}</dt><dd className="font-bold">{formatAmount(drawer.expectedCash)}</dd>
                </dl>
              ) : null}
              <div className="flex flex-wrap items-end gap-2">
                <Field label={t("counted")} onChange={(event) => setCounted(event.target.value)} value={counted} />
                <Button type="submit" variant="secondary">{t("closeShift")}</Button>
              </div>
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
                  <span className="ml-2 font-mono text-slate">{formatAmount(product.retailPrice)}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3"><Soon>{t("cardDisabled")}</Soon></p>
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel title={t("customer")}>
            {customer ? (
              <div className="text-sm">
                <p className="font-semibold">{customer.name}</p>
                <p className="font-mono text-slate">{customer.phone}</p>
                <p>{t("outstanding")} {formatAmount(customer.outstanding)} · {t("available")} {formatAmount(customer.availableCredit)}</p>
                <Button
                  className="mt-2"
                  onClick={() => {
                    setCustomer(undefined);
                    setPriceChoice("RETAIL");
                    setTenders((current) => current.map((row) => row.method === "CREDIT" ? { ...row, method: "CASH" } : row));
                  }}
                  type="button"
                  variant="secondary"
                >
                  {t("walkIn")}
                </Button>
              </div>
            ) : (
              <form
                className="flex flex-col gap-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const search = new URLSearchParams();
                  if (customerQuery.trim()) {
                    search.set("q", customerQuery.trim());
                  }
                  setCustomers(await readJson<Customer[]>(`/api/customers?${search}`));
                }}
              >
                <Field label={t("customerSearch")} onChange={(event) => setCustomerQuery(event.target.value)} value={customerQuery} />
                <Button type="submit" variant="secondary">{t("searchCustomers")}</Button>
              </form>
            )}
            <ul className="mt-2 flex flex-col gap-2 text-sm">
              {customers.filter((row) => !row.archived).map((row) => (
                <li className="flex items-center justify-between gap-2" key={row.id}>
                  <span>{row.name} <span className="text-slate">{row.phone}</span></span>
                  <button className="font-semibold text-indigo" onClick={() => chooseCustomer(row)} type="button">{t("selectCustomer")}</button>
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
            {tenders.map((tender, index) => (
              <div className="mt-3 grid gap-2" key={index}>
                <SelectField
                  label={t("method")}
                  onChange={(event) => {
                    const method = event.target.value as Method;
                    setTenders((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, method } : row));
                  }}
                  value={tender.method}
                >
                  {methods.filter((method) => method !== "CREDIT" || !tenders.some((row, rowIndex) => rowIndex !== index && row.method === "CREDIT")).map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </SelectField>
                <Field label={tender.method === "CASH" ? t("tendered") : t("amount")} onChange={(event) => setTenders((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, amount: event.target.value } : row))} value={tender.amount} />
                {tender.method !== "CASH" && tender.method !== "CREDIT" ? (
                  <Field label={t("reference")} onChange={(event) => setTenders((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, reference: event.target.value } : row))} value={tender.reference} />
                ) : null}
              </div>
            ))}
            <Button
              className="mt-2"
              onClick={() => setTenders((current) => [...current, { method: "CASH", amount: "", reference: "" }])}
              type="button"
              variant="ghost"
            >
              {t("addPayment")}
            </Button>
            <p className="mt-2 text-xs text-slate">{t("changeOnReceipt")}</p>
            <Soon>{t("exactDisabled")}</Soon>
            {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
            <Button className="mt-3 w-full" disabled={lines.length === 0} onClick={() => void checkout()} type="button">{t("charge")}</Button>
            <Button
              className="mt-2 w-full"
              disabled={lines.length === 0}
              onClick={async () => {
                const parked = await readJson<Schemas["SaleView"]>("/api/sales", {
                  method: "POST",
                  body: JSON.stringify({ ...cartBody(), hold: true }),
                });
                router.push(`/sales/${parked.id}`);
              }}
              type="button"
              variant="secondary"
            >
              {t("hold")}
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
