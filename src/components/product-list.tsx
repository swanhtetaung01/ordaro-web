"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge, Button, PageHeader, Soon } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import type { Schemas } from "@/lib/backend";
import { addQuantities, formatAmount, weightedAverageCost } from "@/lib/money";
import { readJson } from "@/lib/read-json";

type Product = Schemas["ProductView"];
type Category = Schemas["CategoryView"];
type Balance = Schemas["BalanceView"];

export function ProductList() {
  const t = useTranslations("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [currency, setCurrency] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stock, setStock] = useState("active");
  const [error, setError] = useState<string>();

  useEffect(() => {
    void Promise.all([
      readJson<Product[]>("/api/catalog/products"),
      readJson<Category[]>("/api/catalog/categories"),
      readJson<Balance[]>("/api/catalog/balances"),
      readJson<Schemas["OrganizationView"]>("/api/catalog/organization"),
    ])
      .then(([nextProducts, nextCategories, nextBalances, organization]) => {
        setProducts(nextProducts);
        setCategories(nextCategories);
        setBalances(nextBalances);
        setCurrency(organization.currencyCode ?? "");
      })
      .catch((caught: Error) => setError(caught.message));
  }, []);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const stockRows = balances.filter((row) => row.productId === product.id);
      const quantity = addQuantities(stockRows.map((row) => row.quantity));
      if (categoryId && product.categoryId !== categoryId) {
        return false;
      }
      if (stock === "active" && product.active === false) {
        return false;
      }
      if (stock === "inactive" && product.active !== false) {
        return false;
      }
      if (stock === "low" && !(product.trackInventory && Number(quantity) > 0 && Number(quantity) <= (product.reorderPoint ?? 0))) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const category = categories.find((row) => row.id === product.categoryId)?.name ?? "";
      return [product.name, product.sku, product.barcodes?.join(" "), category].join(" ").toLowerCase().includes(needle);
    });
  }, [products, balances, categories, query, categoryId, stock]);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <>
            <Button disabled type="button" variant="secondary">
              {t("import")}
            </Button>
            <Button disabled type="button" variant="secondary">
              {t("export")}
            </Button>
            <Link className="rounded-button bg-indigo px-4 py-2.5 text-sm font-semibold text-white" href="/products/new">
              {t("add")}
            </Link>
          </>
        }
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="min-w-0 flex-1 rounded-control border border-line bg-white px-3 py-2 text-sm"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search")}
          value={query}
        />
        <select
          className="rounded-control border border-line bg-white px-3 py-2 text-sm"
          onChange={(event) => setCategoryId(event.target.value)}
          value={categoryId}
        >
          <option value="">{t("allCategories")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-control border border-line bg-white px-3 py-2 text-sm"
          onChange={(event) => setStock(event.target.value)}
          value={stock}
        >
          <option value="active">{t("stockActive")}</option>
          <option value="inactive">{t("stockInactive")}</option>
          <option value="low">{t("stockLow")}</option>
          <option value="all">{t("stockAll")}</option>
        </select>
      </div>
      <Soon>{t("batch")}</Soon>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="overflow-x-auto rounded-panel border border-line bg-white">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="text-xs uppercase text-slate">
            <tr>
              {["product", "sku", "barcode", "category", "cost", "retail", "wholesale", "stock", "status"].map((key) => (
                <th className="px-3 py-3 font-semibold" key={key}>
                  {t(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => {
              const stockRows = balances.filter((row) => row.productId === product.id);
              const quantity = addQuantities(stockRows.map((row) => row.quantity));
              const cost = weightedAverageCost(stockRows);
              const category = categories.find((row) => row.id === product.categoryId)?.name ?? "—";
              return (
                <tr className="border-t border-line" key={product.id}>
                  <td className="px-3 py-3 font-semibold">
                    <Link href={`/products/${product.id}`}>{product.name}</Link>
                  </td>
                  <td className="px-3 py-3 font-mono">{product.sku}</td>
                  <td className="px-3 py-3 font-mono">{product.barcodes?.[0] ?? "—"}</td>
                  <td className="px-3 py-3">{category}</td>
                  <td className="px-3 py-3 font-mono">{cost ? `${formatAmount(cost)} ${currency}` : "—"}</td>
                  <td className="px-3 py-3 font-mono">{formatAmount(product.retailPrice)} {currency}</td>
                  <td className="px-3 py-3 font-mono">{formatAmount(product.wholesalePrice)} {currency}</td>
                  <td className="px-3 py-3 font-mono">{product.trackInventory ? quantity : "—"}</td>
                  <td className="px-3 py-3">
                    <StockBadge active={product.active} quantity={quantity} reorderPoint={product.reorderPoint} tracked={product.trackInventory} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockBadge({
  active,
  tracked,
  quantity,
  reorderPoint,
}: {
  active?: boolean;
  tracked?: boolean;
  quantity: string;
  reorderPoint?: number;
}) {
  const t = useTranslations("products");
  if (active === false) {
    return <Badge tone="muted">{t("inactive")}</Badge>;
  }
  if (!tracked) {
    return <Badge tone="muted">{t("notTracked")}</Badge>;
  }
  const qty = Number(quantity);
  if (qty <= 0) {
    return <Badge tone="bad">{t("outOfStock")}</Badge>;
  }
  if (reorderPoint !== undefined && qty <= reorderPoint) {
    return <Badge tone="warn">{t("lowStock")}</Badge>;
  }
  return <Badge tone="ok">{t("inStock")}</Badge>;
}
