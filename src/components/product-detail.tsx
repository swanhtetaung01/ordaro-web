"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge, Button, PageHeader, Panel, Soon } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import type { Schemas } from "@/lib/backend";
import { addQuantities, formatAmount, marginPercent, weightedAverageCost } from "@/lib/money";
import { readJson } from "@/lib/read-json";

export function ProductDetail({ productId }: { productId: string }) {
  const t = useTranslations("productDetail");
  const [product, setProduct] = useState<Schemas["ProductView"]>();
  const [category, setCategory] = useState("—");
  const [locations, setLocations] = useState<Schemas["LocationView"][]>([]);
  const [balances, setBalances] = useState<Schemas["BalanceView"][]>([]);
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    void Promise.all([
      readJson<Schemas["ProductView"]>(`/api/catalog/products/${productId}`),
      readJson<Schemas["CategoryView"][]>("/api/catalog/categories"),
      readJson<Schemas["LocationView"][]>("/api/catalog/locations"),
      readJson<Schemas["BalanceView"][]>("/api/catalog/balances"),
      readJson<Schemas["OrganizationView"]>("/api/catalog/organization"),
    ]).then(([nextProduct, categories, nextLocations, nextBalances, organization]) => {
      setProduct(nextProduct);
      setCategory(categories.find((row) => row.id === nextProduct.categoryId)?.name ?? "—");
      setLocations(nextLocations);
      setBalances(nextBalances.filter((row) => row.productId === productId));
      setCurrency(organization.currencyCode ?? "");
    });
  }, [productId]);

  if (!product) {
    return null;
  }
  const cost = weightedAverageCost(balances);
  const quantity = addQuantities(balances.map((row) => row.quantity));
  const margin = cost && product.retailPrice !== undefined ? marginPercent(String(product.retailPrice), cost) : null;

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader
        title={product.name ?? ""}
        subtitle={`${product.sku ?? "—"} · ${product.barcodes?.[0] ?? "—"} · ${category}`}
        actions={
          <Link className="rounded-button bg-indigo px-4 py-2.5 text-sm font-semibold text-white" href={`/products/${product.id}/edit`}>
            {t("edit")}
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("retail")} value={`${formatAmount(product.retailPrice)} ${currency}`} note={margin ? `${margin}%` : "—"} />
        <Stat label={t("wholesale")} value={`${formatAmount(product.wholesalePrice)} ${currency}`} />
        <Stat label={t("cost")} value={cost ? `${formatAmount(cost)} ${currency}` : "—"} />
        <Stat label={t("stock")} value={product.trackInventory ? quantity : "—"} />
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge tone="ok">{t("overview")}</Badge>
        <Soon>{t("salesHistory")}</Soon>
        <Soon>{t("promotions")}</Soon>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel title={t("locations")}>
          <ul className="flex flex-col gap-2 text-sm">
            {balances.length === 0 ? <li className="text-slate">{t("noStock")}</li> : null}
            {balances.map((row) => (
              <li className="flex justify-between" key={row.locationId}>
                <span>{locations.find((location) => location.id === row.locationId)?.name ?? row.locationId}</span>
                <span className="font-mono">{row.quantity}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={t("flags")}>
          <p className="text-sm text-slate">
            {t("reorder")}: {product.reorderPoint ?? 0}
          </p>
          <p className="text-sm text-slate">
            {product.sellInPos ? t("inPos") : t("notInPos")} · {product.sellOnline ? t("online") : t("notOnline")}
          </p>
          {product.active === false ? <Badge tone="muted">{t("inactive")}</Badge> : null}
        </Panel>
      </div>
      <Button disabled type="button" variant="secondary">
        {t("salesHistory")}
      </Button>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-panel border border-line bg-white p-4">
      <p className="text-sm text-slate">{label}</p>
      <p className="font-mono text-2xl font-extrabold">{value}</p>
      {note ? <p className="text-xs text-teal">{note}</p> : null}
    </div>
  );
}
