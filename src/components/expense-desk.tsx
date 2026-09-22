"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel, SelectField } from "@/components/ui";
import type { Schemas } from "@/lib/backend";
import { formatAmount } from "@/lib/money";
import { openShiftId } from "@/lib/open-shift";
import { messageFor, readJson } from "@/lib/read-json";
import { useMembershipRole } from "@/lib/role";

type Expense = Schemas["ExpenseView"];
type Category = Schemas["CategoryView"];
type Location = Schemas["LocationView"];
type Method = Schemas["ExpenseWrite"]["method"];

const methods: Method[] = ["CASH", "KBZ_PAY", "WAVE_PAY", "AYA_PAY", "CB_PAY", "BANK_TRANSFER", "OTHER"];

export function ExpenseDesk() {
  const t = useTranslations("expenses");
  const errors = useTranslations("errors");
  const { owner, managesStock } = useMembershipRole();
  const [rows, setRows] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("CASH");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string>();

  function loadCategories() {
    return readJson<Category[]>("/api/expenses/categories").then((found) => {
      setCategories(found);
      if (!categoryId && found[0]?.id) {
        setCategoryId(found[0].id);
      }
    });
  }

  function loadExpenses() {
    const search = new URLSearchParams();
    if (locationId) {
      search.set("locationId", locationId);
    }
    if (from) {
      search.set("from", from);
    }
    if (to) {
      search.set("to", to);
    }
    return readJson<Expense[]>(`/api/expenses${search.size ? `?${search}` : ""}`).then(setRows);
  }

  useEffect(() => {
    void loadCategories();
    void readJson<Location[]>("/api/org/locations").then((found) => {
      setLocations(found);
      if (found[0]?.id) {
        setLocationId(found[0].id);
      }
    });
    void loadExpenses().catch((caught) => setError(messageFor(caught, errors, (code) => errors.has(code))));
    // First paint uses the backend's default month.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {managesStock ? (
        <Panel title={t("categories")}>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setError(undefined);
              try {
                await readJson("/api/expenses/categories", { method: "POST", body: JSON.stringify({ name: categoryName }) });
                setCategoryName("");
                await loadCategories();
              } catch (caught) {
                setError(messageFor(caught, errors, (code) => errors.has(code)));
              }
            }}
          >
            <Field label={t("category")} onChange={(event) => setCategoryName(event.target.value)} required value={categoryName} />
            <Button type="submit">{t("addCategory")}</Button>
          </form>
          <ul className="mt-3 flex flex-col gap-1 text-sm">
            {categories.map((category) => (
              <li className="flex items-center justify-between" key={category.id}>
                <span>{category.name}</span>
                {owner ? (
                  <button
                    className="font-semibold text-danger"
                    onClick={() => {
                      void readJson(`/api/expenses/categories/${category.id}/archive`, { method: "POST" }).then(() => loadCategories());
                    }}
                    type="button"
                  >
                    {t("archive")}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <Panel title={t("record")}>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(undefined);
            try {
              const cashierShiftId = method === "CASH" ? await openShiftId(locationId) : undefined;
              await readJson("/api/expenses", {
                method: "POST",
                body: JSON.stringify({
                  categoryId,
                  locationId,
                  cashierShiftId,
                  amount,
                  method,
                  description: description || undefined,
                  referenceNo: reference || undefined,
                }),
              });
              setAmount("");
              setDescription("");
              await loadExpenses();
            } catch (caught) {
              setError(messageFor(caught, errors, (code) => errors.has(code)));
            }
          }}
        >
          <SelectField label={t("category")} onChange={(event) => setCategoryId(event.target.value)} value={categoryId}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </SelectField>
          <SelectField label={t("location")} onChange={(event) => setLocationId(event.target.value)} value={locationId}>
            {locations.map((row) => (
              <option key={row.id} value={row.id}>{row.name}</option>
            ))}
          </SelectField>
          <Field label={t("amount")} onChange={(event) => setAmount(event.target.value)} required value={amount} />
          <SelectField label={t("method")} onChange={(event) => setMethod(event.target.value as Method)} value={method}>
            {methods.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </SelectField>
          <Field label={t("description")} onChange={(event) => setDescription(event.target.value)} value={description} />
          <Field label={t("reference")} onChange={(event) => setReference(event.target.value)} value={reference} />
          <Button disabled={!categoryId || !locationId} type="submit">{t("record")}</Button>
        </form>
      </Panel>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void loadExpenses();
        }}
      >
        <Field label={t("from")} onChange={(event) => setFrom(event.target.value)} type="date" value={from} />
        <Field label={t("to")} onChange={(event) => setTo(event.target.value)} type="date" value={to} />
        <Button type="submit" variant="secondary">{t("apply")}</Button>
      </form>
      <p className="text-xs text-slate">{t("monthNote")}</p>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="overflow-x-auto rounded-panel border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase text-slate">
            <tr>
              {["category", "amount", "method", "description"].map((column) => (
                <th className="px-3 py-3 font-semibold" key={column}>{t(column)}</th>
              ))}
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className={`border-t border-line ${row.voidedAt ? "line-through text-slate" : ""}`} key={row.id}>
                <td className="px-3 py-3">{row.categoryName}</td>
                <td className="px-3 py-3 font-mono">{formatAmount(row.amount)}</td>
                <td className="px-3 py-3">{row.method}</td>
                <td className="px-3 py-3">{row.description}</td>
                <td className="px-3 py-3 text-right">
                  {managesStock && !row.voidedAt ? (
                    <button
                      className="font-semibold text-danger no-underline"
                      onClick={async () => {
                        setError(undefined);
                        try {
                          await readJson(`/api/expenses/${row.id}/void`, { method: "POST" });
                          await loadExpenses();
                        } catch (caught) {
                          setError(messageFor(caught, errors, (code) => errors.has(code)));
                        }
                      }}
                      type="button"
                    >
                      {t("void")}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
