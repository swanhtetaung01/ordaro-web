"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel, SelectField, Soon } from "@/components/ui";
import type { Schemas } from "@/lib/backend";
import { readJson } from "@/lib/read-json";

type Category = Schemas["CategoryView"] & { parentId?: string };
type Product = Schemas["ProductView"];

export function CategoryManager() {
  const t = useTranslations("categories");
  const errors = useTranslations("errors");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string>();

  async function load() {
    const [nextCategories, nextProducts] = await Promise.all([
      readJson<Category[]>("/api/catalog/categories"),
      readJson<Product[]>("/api/catalog/products"),
    ]);
    setCategories(nextCategories);
    setProducts(nextProducts);
  }

  useEffect(() => {
    void Promise.all([
      readJson<Category[]>("/api/catalog/categories"),
      readJson<Product[]>("/api/catalog/products"),
    ]).then(([nextCategories, nextProducts]) => {
      setCategories(nextCategories);
      setProducts(nextProducts);
    });
  }, []);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return categories.filter((category) => !needle || (category.name ?? "").toLowerCase().includes(needle));
  }, [categories, query]);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Panel title={t("create")}>
          <form
            className="flex flex-col gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setError(undefined);
              try {
                await readJson("/api/catalog/categories", {
                  method: "POST",
                  body: JSON.stringify({ name, parentId: parentId || undefined }),
                });
                setName("");
                setParentId("");
                await load();
              } catch (caught) {
                const code = caught instanceof Error ? caught.message : "unknown";
                setError(errors.has(code) ? errors(code) : errors("unknown"));
              }
            }}
          >
            <Field label={t("name")} onChange={(event) => setName(event.target.value)} required value={name} />
            <SelectField label={t("parent")} onChange={(event) => setParentId(event.target.value)} value={parentId}>
              <option value="">{t("noParent")}</option>
              {categories
                .filter((category) => !category.parentId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </SelectField>
            <Button disabled={!name} type="submit">
              {t("add")}
            </Button>
          </form>
        </Panel>
        <Panel>
          <input
            className="mb-3 w-full rounded-control border border-line px-3 py-2 text-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search")}
            value={query}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-slate">
                <tr>
                  <th className="py-2">{t("name")}</th>
                  <th>{t("parent")}</th>
                  <th>{t("count")}</th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((category) => (
                  <tr className="border-t border-line" key={category.id}>
                    <td className="py-2 font-medium">{category.name}</td>
                    <td>{categories.find((row) => row.id === category.parentId)?.name ?? t("noParent")}</td>
                    <td>{products.filter((product) => product.categoryId === category.id).length}</td>
                    <td>
                      <button
                        className="text-sm text-teal"
                        onClick={async () => {
                          const next = window.prompt(t("rename"), category.name ?? "");
                          if (!next || !category.id) {
                            return;
                          }
                          await readJson(`/api/catalog/categories/${category.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ name: next }),
                          });
                          await load();
                        }}
                        type="button"
                      >
                        {t("rename")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Soon>{t("status")}</Soon>
        </Panel>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
