"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { BoxIcon, PlusIcon } from "@/components/icons";
import {
  Alert,
  Button,
  EmptyState,
  Field,
  insetFocusRing,
  LoadingRows,
  Modal,
  Page,
  PageHeader,
  SearchField,
  SelectField,
} from "@/components/ui";
import type { Schemas } from "@/lib/backend";
import { messageFor, readJson } from "@/lib/read-json";

type Category = Schemas["CategoryView"] & { parentId?: string };
type Product = Schemas["ProductView"];

export function CategoryManager() {
  const t = useTranslations("categories");
  const errors = useTranslations("errors");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState<Category>();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState<"add" | "rename">();

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
    ])
      .then(([nextCategories, nextProducts]) => {
        setCategories(nextCategories);
        setProducts(nextProducts);
      })
      .catch((caught) => setError(messageFor(caught, errors, (code) => errors.has(code))))
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- translator identity is not a reload
  }, []);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return categories.filter((category) => !needle || (category.name ?? "").toLowerCase().includes(needle));
  }, [categories, query]);

  function fail(caught: unknown) {
    setFormError(messageFor(caught, errors, (code) => errors.has(code)));
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setFormError(undefined);
    setBusy("add");
    try {
      await readJson("/api/catalog/categories", {
        method: "POST",
        body: JSON.stringify({ name, parentId: parentId || undefined }),
      });
      setName("");
      setParentId("");
      setAdding(false);
      await load();
    } catch (caught) {
      fail(caught);
    } finally {
      setBusy(undefined);
    }
  }

  async function rename(event: React.FormEvent) {
    event.preventDefault();
    if (!renaming?.id || !newName.trim()) {
      return;
    }
    setFormError(undefined);
    setBusy("rename");
    try {
      await readJson(`/api/catalog/categories/${renaming.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
      });
      setRenaming(undefined);
      await load();
    } catch (caught) {
      fail(caught);
    } finally {
      setBusy(undefined);
    }
  }

  const parentName = (category: Category) => categories.find((row) => row.id === category.parentId)?.name;
  const count = (category: Category) => products.filter((product) => product.categoryId === category.id).length;
  const openRename = (category: Category) => {
    setFormError(undefined);
    setNewName(category.name ?? "");
    setRenaming(category);
  };
  const addButton = (variant: "primary" | "secondary") => (
    <Button
      onClick={() => {
        setFormError(undefined);
        setAdding(true);
      }}
      type="button"
      variant={variant}
    >
      <PlusIcon className="size-5" />
      {t("add")}
    </Button>
  );

  return (
    <Page>
      <PageHeader actions={addButton("primary")} subtitle={t("subtitle")} title={t("title")} />
      {categories.length > 0 ? <SearchField label={t("search")} onChange={(event) => setQuery(event.target.value)} value={query} /> : null}
      {error ? <Alert>{error}</Alert> : null}

      {!loaded ? (
        <LoadingRows rows={4} />
      ) : categories.length === 0 ? (
        error ? null : <EmptyState action={addButton("secondary")} hint={t("emptyHint")} icon={<BoxIcon className="size-6" />} title={t("empty")} />
      ) : rows.length === 0 ? (
        <EmptyState hint={t("noMatchHint")} title={t("noMatch")} />
      ) : (
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-panel border border-line bg-white shadow-xs">
          {rows.map((category) => (
            <li key={category.id}>
              <button
                className={`flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50 motion-reduce:transition-none ${insetFocusRing}`}
                onClick={() => openRename(category)}
                type="button"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{category.name}</span>
                  {parentName(category) ? <span className="block truncate text-xs text-slate">{t("inParent", { parent: parentName(category) ?? "" })}</span> : null}
                </span>
                <span className="shrink-0 text-sm text-slate tabular-nums">{t("productCount", { count: count(category) })}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal onClose={() => setAdding(false)} open={adding} title={t("create")}>
        <form className="flex flex-col gap-4" onSubmit={(event) => void add(event)}>
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
          <p className="text-xs text-slate">{t("parentHint")}</p>
          {formError ? <Alert>{formError}</Alert> : null}
          <Button busy={busy === "add"} className="self-start" disabled={!name} type="submit">
            {t("add")}
          </Button>
        </form>
      </Modal>

      <Modal onClose={() => setRenaming(undefined)} open={renaming !== undefined} title={t("renameTitle")}>
        <form className="flex flex-col gap-4" onSubmit={(event) => void rename(event)}>
          <Field label={t("rename")} onChange={(event) => setNewName(event.target.value)} required value={newName} />
          {renaming ? <p className="text-sm text-slate">{t("productCount", { count: count(renaming) })}</p> : null}
          {formError ? <Alert>{formError}</Alert> : null}
          <Button busy={busy === "rename"} className="self-start" disabled={!newName.trim()} type="submit">
            {t("save")}
          </Button>
        </form>
      </Modal>
    </Page>
  );
}
