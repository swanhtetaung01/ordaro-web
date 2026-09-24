"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel, SelectField } from "@/components/ui";
import type { Schemas } from "@/lib/backend";
import { formatAmount } from "@/lib/money";
import { messageFor, readJson } from "@/lib/read-json";
import { useMembershipRole } from "@/lib/role";

type Customer = Schemas["CustomerView"];

const empty = {
  name: "",
  phone: "",
  type: "MEMBER" as "MEMBER" | "B2B",
  defaultPriceType: "RETAIL" as "RETAIL" | "WHOLESALE",
  creditLimit: "",
  creditTermDays: "",
  address: "",
  note: "",
};

export function CustomerDesk() {
  const t = useTranslations("customers");
  const errors = useTranslations("errors");
  const { owner, managesStock } = useMembershipRole();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Customer[]>([]);
  const [editing, setEditing] = useState<string>();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string>();

  function load(q = query) {
    const search = new URLSearchParams();
    if (q.trim()) {
      search.set("q", q.trim());
    }
    return readJson<Customer[]>(`/api/customers${search.size ? `?${search}` : ""}`).then(setRows);
  }

  useEffect(() => {
    void load("");
    // The first list is the unfiltered register search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fill(customer: Customer) {
    setEditing(customer.id);
    setForm({
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      type: customer.type ?? "MEMBER",
      defaultPriceType: customer.defaultPriceType ?? "RETAIL",
      creditLimit: customer.creditLimit == null ? "" : String(customer.creditLimit),
      creditTermDays: customer.creditTermDays == null ? "" : String(customer.creditTermDays),
      address: customer.address ?? "",
      note: customer.note ?? "",
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    const body: Schemas["CustomerWrite"] = {
      name: form.name,
      phone: form.phone,
      type: form.type,
      defaultPriceType: form.defaultPriceType,
      address: form.address,
      note: form.note,
    };
    if (owner) {
      if (form.creditLimit) {
        body.creditLimit = form.creditLimit as unknown as number;
      }
      if (form.creditTermDays) {
        body.creditTermDays = Number(form.creditTermDays);
      }
    }
    try {
      if (editing) {
        await readJson(`/api/customers/${editing}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await readJson("/api/customers", { method: "POST", body: JSON.stringify(body) });
      }
      setEditing(undefined);
      setForm(empty);
      await load();
    } catch (caught) {
      setError(messageFor(caught, errors, (key) => errors.has(key)));
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Panel title={editing ? t("edit") : t("create")}>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void save(event)}>
          <Field label={t("name")} onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} />
          <Field label={t("phone")} onChange={(event) => setForm({ ...form, phone: event.target.value })} value={form.phone} />
          <SelectField label={t("type")} onChange={(event) => setForm({ ...form, type: event.target.value as typeof form.type })} value={form.type}>
            <option value="MEMBER">MEMBER</option>
            <option value="B2B">B2B</option>
          </SelectField>
          <SelectField
            label={t("priceType")}
            onChange={(event) => setForm({ ...form, defaultPriceType: event.target.value as typeof form.defaultPriceType })}
            value={form.defaultPriceType}
          >
            <option value="RETAIL">RETAIL</option>
            <option value="WHOLESALE">WHOLESALE</option>
          </SelectField>
          {owner ? (
            <>
              <Field inputMode="decimal" label={t("creditLimit")} onChange={(event) => setForm({ ...form, creditLimit: event.target.value })} value={form.creditLimit} />
              <Field inputMode="numeric" label={t("creditTerm")} onChange={(event) => setForm({ ...form, creditTermDays: event.target.value })} value={form.creditTermDays} />
            </>
          ) : null}
          <Field label={t("address")} onChange={(event) => setForm({ ...form, address: event.target.value })} value={form.address} />
          <Field label={t("note")} onChange={(event) => setForm({ ...form, note: event.target.value })} value={form.note} />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">{editing ? t("save") : t("create")}</Button>
            {editing ? (
              <Button
                onClick={() => {
                  setEditing(undefined);
                  setForm(empty);
                }}
                type="button"
                variant="secondary"
              >
                {t("cancel")}
              </Button>
            ) : null}
          </div>
        </form>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </Panel>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <input
          className="w-full rounded-control border border-line px-3 py-2 text-sm"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search")}
          value={query}
        />
        <Button type="submit" variant="secondary">{t("searchAction")}</Button>
      </form>
      <div className="overflow-x-auto rounded-panel border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-slate">
            <tr>
              {["name", "phone", "type", "outstanding", "available", "status"].map((key) => (
                <th className="px-3 py-3 font-semibold" key={key}>{t(key)}</th>
              ))}
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((customer) => (
              <tr className="border-t border-line" key={customer.id}>
                <td className="px-3 py-3 font-semibold">{customer.name}</td>
                <td className="px-3 py-3 font-mono">{customer.phone ?? "—"}</td>
                <td className="px-3 py-3">{customer.type}</td>
                <td className="px-3 py-3 font-mono">{formatAmount(customer.outstanding)}</td>
                <td className="px-3 py-3 font-mono">{formatAmount(customer.availableCredit)}</td>
                <td className="px-3 py-3">{customer.archived ? t("archived") : t("active")}</td>
                <td className="px-3 py-3 text-right">
                  <button className="font-semibold text-teal" onClick={() => fill(customer)} type="button">{t("edit")}</button>
                  {managesStock && !customer.archived ? (
                    <button
                      className="ml-3 font-semibold text-danger"
                      onClick={() => {
                        void readJson(`/api/customers/${customer.id}/archive`, { method: "POST" }).then(() => load());
                      }}
                      type="button"
                    >
                      {t("archive")}
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
