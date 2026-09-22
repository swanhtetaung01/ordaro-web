"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel, SelectField } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import type { Schemas } from "@/lib/backend";
import { formatAmount } from "@/lib/money";
import { messageFor, readJson } from "@/lib/read-json";

type Doc = Schemas["DocumentSummary"];
type Product = Schemas["ProductView"];
type Location = Schemas["LocationView"];
type Supplier = Schemas["SupplierView"];
type Movement = Schemas["MovementView"];

const types = ["STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "TRANSFER", "OPENING"] as const;

export function StockDesk() {
  const t = useTranslations("stock");
  const errors = useTranslations("errors");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [type, setType] = useState<(typeof types)[number]>("STOCK_IN");
  const [locationId, setLocationId] = useState("");
  const [otherLocationId, setOtherLocationId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [movements, setMovements] = useState<Movement[]>([]);
  const [error, setError] = useState<string>();
  const [payableId, setPayableId] = useState<string>();

  function load() {
    return readJson<Doc[]>("/api/stock/documents").then(setDocs);
  }

  useEffect(() => {
    void readJson<Doc[]>("/api/stock/documents").then(setDocs);
    void readJson<Product[]>("/api/catalog/products").then((rows) => {
      setProducts(rows);
      if (rows[0]?.id) {
        setProductId(rows[0].id);
      }
    });
    void readJson<Location[]>("/api/org/locations").then((rows) => {
      setLocations(rows);
      if (rows[0]?.id) {
        setLocationId(rows[0].id);
      }
    });
    void readJson<Supplier[]>("/api/catalog/suppliers").then(setSuppliers);
  }, []);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Panel title={t("post")}>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(undefined);
            try {
              const posted = await readJson<Schemas["DocumentView"]>("/api/stock/documents", {
                method: "POST",
                body: JSON.stringify({
                  type,
                  locationId,
                  counterpartyLocationId: type === "TRANSFER" ? otherLocationId : undefined,
                  supplierId: type === "STOCK_IN" ? supplierId || undefined : undefined,
                  lines: [{ productId, quantity, unitCost: unitCost || undefined }],
                  post: true,
                }),
              });
              setPayableId(posted.payableId);
              setQuantity("");
              await load();
            } catch (caught) {
              setError(messageFor(caught, errors, (code) => errors.has(code)));
            }
          }}
        >
          <SelectField label={t("type")} onChange={(event) => setType(event.target.value as typeof type)} value={type}>
            {types.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </SelectField>
          <SelectField label={t("location")} onChange={(event) => setLocationId(event.target.value)} value={locationId}>
            {locations.map((row) => (
              <option key={row.id} value={row.id}>{row.name}</option>
            ))}
          </SelectField>
          {type === "TRANSFER" ? (
            <SelectField label={t("destination")} onChange={(event) => setOtherLocationId(event.target.value)} value={otherLocationId}>
              <option value="">{t("choose")}</option>
              {locations.filter((row) => row.id !== locationId).map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </SelectField>
          ) : null}
          {type === "STOCK_IN" ? (
            <SelectField label={t("supplier")} onChange={(event) => setSupplierId(event.target.value)} value={supplierId}>
              <option value="">{t("none")}</option>
              {suppliers.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </SelectField>
          ) : null}
          <SelectField label={t("product")} onChange={(event) => setProductId(event.target.value)} value={productId}>
            {products.map((row) => (
              <option key={row.id} value={row.id}>{row.name}</option>
            ))}
          </SelectField>
          <Field label={t("quantity")} onChange={(event) => setQuantity(event.target.value)} required value={quantity} />
          <Field label={t("unitCost")} onChange={(event) => setUnitCost(event.target.value)} value={unitCost} />
          <Button disabled={!quantity || !locationId || !productId} type="submit">{t("postNow")}</Button>
        </form>
      </Panel>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {payableId ? (
        <p className="text-sm">
          <Link className="font-semibold text-indigo" href={`/payables?id=${payableId}`}>{t("payable")}</Link>
        </p>
      ) : null}
      <Panel title={t("recent")}>
        <ul className="flex flex-col gap-2 text-sm">
          {docs.map((doc) => (
            <li className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2" key={doc.id}>
              <span>
                <span className="font-mono">{doc.documentNumber ?? doc.id}</span> {doc.type} {doc.status}
              </span>
              {doc.status === "POSTED" ? (
                <Button
                  onClick={async () => {
                    setError(undefined);
                    try {
                      await readJson(`/api/stock/documents/${doc.id}?action=void`, { method: "POST" });
                      await load();
                    } catch (caught) {
                      setError(messageFor(caught, errors, (code) => errors.has(code)));
                    }
                  }}
                  type="button"
                  variant="danger"
                >
                  {t("void")}
                </Button>
              ) : null}
              {doc.status === "DRAFT" ? (
                <Button
                  onClick={async () => {
                    await readJson(`/api/stock/documents/${doc.id}?action=post`, { method: "POST" });
                    await load();
                  }}
                  type="button"
                >
                  {t("postNow")}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title={t("ledger")}>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setMovements(await readJson<Movement[]>(`/api/stock/movements?locationId=${locationId}&productId=${productId}`));
          }}
        >
          <Button type="submit" variant="secondary">{t("showLedger")}</Button>
        </form>
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {movements.map((row) => (
            <li className="font-mono" key={row.id}>
              {row.type} {row.quantity} @ {formatAmount(row.unitCost)}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
