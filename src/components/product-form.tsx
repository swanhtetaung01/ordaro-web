"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel, SelectField, Soon } from "@/components/ui";
import { useRouter } from "@/i18n/navigation";
import type { Schemas } from "@/lib/backend";
import { formatAmount, marginPercent, profitPerUnit } from "@/lib/money";
import { readJson } from "@/lib/read-json";

type Category = Schemas["CategoryView"];
type Location = Schemas["LocationView"];

export function ProductForm({ productId }: { productId?: string }) {
  const t = useTranslations("productForm");
  const errors = useTranslations("errors");
  const router = useRouter();
  const editing = Boolean(productId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [currency, setCurrency] = useState("");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState<Schemas["ProductWrite"]["unit"]>("PIECE");
  const [sizeLabel, setSizeLabel] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [openingCost, setOpeningCost] = useState("");
  const [openingQty, setOpeningQty] = useState("");
  const [locationId, setLocationId] = useState("");
  const [trackInventory, setTrackInventory] = useState(true);
  const [reorderPoint, setReorderPoint] = useState("0");
  const [sellInPos, setSellInPos] = useState(true);
  const [sellOnline, setSellOnline] = useState(false);
  const [taxable, setTaxable] = useState(true);
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void Promise.all([
      readJson<Category[]>("/api/catalog/categories"),
      readJson<Location[]>("/api/catalog/locations"),
      readJson<Schemas["OrganizationView"]>("/api/catalog/organization"),
    ]).then(([nextCategories, nextLocations, organization]) => {
      setCategories(nextCategories);
      setLocations(nextLocations.filter((row) => row.active !== false));
      setCurrency(organization.currencyCode ?? "");
      const first = nextLocations.find((row) => row.active !== false);
      if (first?.id) {
        setLocationId(first.id);
      }
    });
    if (!productId) {
      return;
    }
    void readJson<Schemas["ProductView"]>(`/api/catalog/products/${productId}`).then((product) => {
      setName(product.name ?? "");
      setSku(product.sku ?? "");
      setBarcode(product.barcodes?.[0] ?? "");
      setCategoryId(product.categoryId ?? "");
      setUnit(product.unit ?? "PIECE");
      setSizeLabel(product.sizeLabel ?? "");
      setRetailPrice(product.retailPrice === undefined ? "" : String(product.retailPrice));
      setWholesalePrice(product.wholesalePrice === undefined ? "" : String(product.wholesalePrice));
      setTrackInventory(product.trackInventory !== false);
      setReorderPoint(String(product.reorderPoint ?? 0));
      setSellInPos(product.sellInPos !== false);
      setSellOnline(product.sellOnline === true);
      setTaxable(product.taxable !== false);
      setActive(product.active !== false);
    });
  }, [productId]);

  const margin = marginPercent(retailPrice, openingCost);
  const profit = profitPerUnit(retailPrice, openingCost);

  async function save() {
    setPending(true);
    setError(undefined);
    const body = {
      name,
      sku: sku || undefined,
      categoryId: categoryId || undefined,
      unit,
      sizeLabel: sizeLabel || undefined,
      retailPrice: retailPrice || undefined,
      wholesalePrice: wholesalePrice || undefined,
      trackInventory,
      reorderPoint: Number(reorderPoint || 0),
      sellInPos,
      sellOnline,
      taxable,
      active,
      barcodes: barcode ? [barcode] : undefined,
      openingStock:
        !editing && openingQty && locationId
          ? [{ locationId, quantity: openingQty, unitCost: openingCost || undefined }]
          : undefined,
    } as Schemas["ProductWrite"];
    try {
      const saved = await readJson<Schemas["ProductView"]>(
        editing ? `/api/catalog/products/${productId}` : "/api/catalog/products",
        { method: editing ? "PATCH" : "POST", body: JSON.stringify(body) },
      );
      router.push(`/products/${saved.id}`);
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "unknown";
      setError(errors.has(code) ? errors(code) : errors("unknown"));
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={editing ? t("editTitle") : t("addTitle")} subtitle={t("subtitle")} />
      <Panel title={t("basics")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("name")} onChange={(event) => setName(event.target.value)} required value={name} />
          <Field label={t("sku")} onChange={(event) => setSku(event.target.value)} value={sku} />
          <Field label={t("barcode")} onChange={(event) => setBarcode(event.target.value)} value={barcode} />
          <SelectField label={t("category")} onChange={(event) => setCategoryId(event.target.value)} value={categoryId}>
            <option value="">{t("noCategory")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <SelectField label={t("unit")} onChange={(event) => setUnit(event.target.value as typeof unit)} value={unit}>
            {["PIECE", "BAG", "BOX", "KG", "LITRE", "PACK"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SelectField>
          <Field label={t("size")} onChange={(event) => setSizeLabel(event.target.value)} value={sizeLabel} />
        </div>
      </Panel>
      <Panel title={t("type")}>
        <div className="grid gap-3 sm:grid-cols-3">
          <p className="rounded-button border border-indigo p-3 text-sm font-semibold text-indigo">{t("standard")}</p>
          <p className="rounded-button border border-line p-3 text-sm text-slate">
            {t("variants")}
            <br />
            <Soon>{t("variantsHint")}</Soon>
          </p>
          <p className="rounded-button border border-line p-3 text-sm text-slate">
            {t("service")}
            <br />
            <Soon>{t("serviceHint")}</Soon>
          </p>
        </div>
      </Panel>
      <Panel title={t("prices")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            disabled={editing}
            hint={editing ? t("costLocked") : t("openingCost")}
            label={t("cost")}
            onChange={(event) => setOpeningCost(event.target.value)}
            value={openingCost}
          />
          <Field label={`${t("retail")} (${currency})`} onChange={(event) => setRetailPrice(event.target.value)} value={retailPrice} />
          <Field label={`${t("wholesale")} (${currency})`} onChange={(event) => setWholesalePrice(event.target.value)} value={wholesalePrice} />
        </div>
        <p className="mt-4 font-mono text-sm">
          {t("margin")} {margin ?? "—"}% · {t("profit")} {profit ? `${formatAmount(profit)} ${currency}` : "—"}
        </p>
      </Panel>
      <Panel title={t("inventory")}>
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input checked={trackInventory} onChange={(event) => setTrackInventory(event.target.checked)} type="checkbox" />
          {t("track")}
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          {editing ? null : (
            <>
              <SelectField label={t("location")} onChange={(event) => setLocationId(event.target.value)} value={locationId}>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </SelectField>
              <Field label={t("openingQty")} onChange={(event) => setOpeningQty(event.target.value)} value={openingQty} />
            </>
          )}
          <Field label={t("reorder")} onChange={(event) => setReorderPoint(event.target.value)} value={reorderPoint} />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input checked={sellInPos} onChange={(event) => setSellInPos(event.target.checked)} type="checkbox" />
            {t("sellPos")}
          </label>
          <label className="flex items-center gap-2">
            <input checked={sellOnline} onChange={(event) => setSellOnline(event.target.checked)} type="checkbox" />
            {t("sellOnline")}
          </label>
          <label className="flex items-center gap-2">
            <input checked={taxable} onChange={(event) => setTaxable(event.target.checked)} type="checkbox" />
            {t("taxable")}
          </label>
          <label className="flex items-center gap-2">
            <input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" />
            {t("active")}
          </label>
        </div>
      </Panel>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button onClick={() => router.push(editing ? `/products/${productId}` : "/products")} type="button" variant="secondary">
          {t("cancel")}
        </Button>
        {editing ? (
          <Button
            onClick={async () => {
              await readJson(`/api/catalog/products/${productId}`, { method: "DELETE" });
              router.push("/products");
            }}
            type="button"
            variant="danger"
          >
            {t("archive")}
          </Button>
        ) : null}
        <Button disabled={pending || !name} onClick={() => void save()} type="button">
          {pending ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
