"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel, SelectField } from "@/components/ui";
import type { Schemas } from "@/lib/backend";
import { formatAmount } from "@/lib/money";
import { openShiftId } from "@/lib/open-shift";
import { messageFor, readJson, readResponse } from "@/lib/read-json";
import { useMembershipRole } from "@/lib/role";

type Row = Schemas["PayableView"];
type Supplier = Schemas["SupplierView"];
type Location = Schemas["LocationView"];
type Method = "CASH" | "KBZ_PAY" | "WAVE_PAY" | "AYA_PAY" | "CB_PAY" | "BANK_TRANSFER" | "OTHER";

const methods: Method[] = ["CASH", "KBZ_PAY", "WAVE_PAY", "AYA_PAY", "CB_PAY", "BANK_TRANSFER", "OTHER"];

export function PayableDesk({ initialId }: { initialId?: string }) {
  const t = useTranslations("payables");
  const errors = useTranslations("errors");
  const { owner, role, ready } = useMembershipRole();
  const [rows, setRows] = useState<Row[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [status, setStatus] = useState("open");
  const [overdue, setOverdue] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [selected, setSelected] = useState<Row>();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("CASH");
  const [locationId, setLocationId] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualSupplier, setManualSupplier] = useState("");
  const [manualDue, setManualDue] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [key, setKey] = useState(() => crypto.randomUUID());

  function load() {
    const search = new URLSearchParams({ status });
    if (overdue) {
      search.set("overdue", "true");
    }
    if (supplierId) {
      search.set("supplierId", supplierId);
    }
    return readJson<Row[]>(`/api/payables?${search}`).then(setRows);
  }

  useEffect(() => {
    if (!ready || role === "CASHIER" || role === "PACKER") {
      return;
    }
    void readJson<Supplier[]>("/api/catalog/suppliers").then(setSuppliers);
    void readJson<Location[]>("/api/org/locations").then((found) => {
      setLocations(found);
      if (found[0]?.id) {
        setLocationId(found[0].id);
      }
    });
    if (initialId) {
      void readJson<Row>(`/api/payables/${initialId}`).then(setSelected).catch((caught) => {
        setError(messageFor(caught, errors, (code) => errors.has(code)));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- translator identity is not a reload
  }, [ready, role, initialId]);

  useEffect(() => {
    if (!ready || role === "CASHIER" || role === "PACKER") {
      return;
    }
    void load().catch((caught) => setError(messageFor(caught, errors, (code) => errors.has(code))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, overdue, supplierId, ready, role]);

  if (ready && (role === "CASHIER" || role === "PACKER")) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-8">
        <PageHeader title={t("title")} subtitle={t("cashiers")} />
      </div>
    );
  }

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    if (!selected?.id) {
      return;
    }
    setError(undefined);
    setNotice(undefined);
    try {
      const cashierShiftId = method === "CASH" ? await openShiftId(locationId) : undefined;
      const result = await readResponse<Row>(`/api/payables/${selected.id}/settlements`, {
        method: "POST",
        body: JSON.stringify({
          amount,
          method,
          locationId,
          cashierShiftId,
          referenceNo: reference || undefined,
          note: note || undefined,
          idempotencyKey: key,
        }),
      });
      setNotice(result.replayed ? t("replayed") : t("recorded"));
      setKey(crypto.randomUUID());
      setAmount("");
      setSelected(result.data);
      await load();
    } catch (caught) {
      setError(messageFor(caught, errors, (code) => errors.has(code)));
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-wrap items-end gap-3">
        <SelectField label={t("status")} onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="open">{t("open")}</option>
          <option value="all">{t("all")}</option>
        </SelectField>
        <SelectField label={t("supplier")} onChange={(event) => setSupplierId(event.target.value)} value={supplierId}>
          <option value="">{t("allSuppliers")}</option>
          {suppliers.map((row) => (
            <option key={row.id} value={row.id}>{row.name}</option>
          ))}
        </SelectField>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input checked={overdue} onChange={(event) => setOverdue(event.target.checked)} type="checkbox" />
          {t("overdue")}
        </label>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="overflow-x-auto rounded-panel border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase text-slate">
            <tr>
              {["supplier", "outstanding", "due", "status"].map((column) => (
                <th className="px-3 py-3 font-semibold" key={column}>{t(column)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-line" key={row.id}>
                <td className="px-3 py-3">
                  <button className="font-semibold text-indigo" onClick={() => void readJson<Row>(`/api/payables/${row.id}`).then(setSelected)} type="button">{row.supplierName}</button>
                </td>
                <td className="px-3 py-3 font-mono">{formatAmount(row.outstandingAmount)}</td>
                <td className="px-3 py-3">{row.dueDate}{row.overdue ? ` · ${t("overdue")}` : ""}</td>
                <td className="px-3 py-3">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected ? (
        <Panel title={selected.supplierName}>
          <p className="font-mono text-sm">{t("outstanding")} {formatAmount(selected.outstandingAmount)} · {selected.referenceNumber} · {selected.status}</p>
          <ul className="mt-3 flex flex-col gap-1 text-sm">
            {selected.settlements?.map((settlement) => (
              <li key={settlement.id}>{settlement.method} {formatAmount(settlement.amount)} {settlement.referenceNo}</li>
            ))}
          </ul>
          {selected.status === "OPEN" || selected.status === "PARTIALLY_SETTLED" ? (
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => void pay(event)}>
              <Field label={t("amount")} onChange={(event) => setAmount(event.target.value)} required value={amount} />
              <SelectField label={t("method")} onChange={(event) => setMethod(event.target.value as Method)} value={method}>
                {methods.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </SelectField>
              <SelectField label={t("location")} onChange={(event) => setLocationId(event.target.value)} value={locationId}>
                {locations.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </SelectField>
              <Field label={t("reference")} onChange={(event) => setReference(event.target.value)} value={reference} />
              <Field label={t("note")} onChange={(event) => setNote(event.target.value)} value={note} />
              <Button type="submit">{t("pay")}</Button>
            </form>
          ) : null}
          {notice ? <p className="mt-3 text-sm text-teal">{notice}</p> : null}
        </Panel>
      ) : null}
      {owner ? (
        <Panel title={t("manual")}>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setError(undefined);
              try {
                const created = await readJson<Row>("/api/payables", {
                  method: "POST",
                  body: JSON.stringify({
                    supplierId: manualSupplier,
                    locationId,
                    amount: manualAmount,
                    dueDate: manualDue || undefined,
                    note: manualNote || undefined,
                  }),
                });
                setManualAmount("");
                setSelected(created);
                await load();
              } catch (caught) {
                setError(messageFor(caught, errors, (code) => errors.has(code)));
              }
            }}
          >
            <SelectField label={t("supplier")} onChange={(event) => setManualSupplier(event.target.value)} required value={manualSupplier}>
              <option value="">{t("allSuppliers")}</option>
              {suppliers.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </SelectField>
            <Field label={t("amount")} onChange={(event) => setManualAmount(event.target.value)} required value={manualAmount} />
            <Field label={t("due")} onChange={(event) => setManualDue(event.target.value)} type="date" value={manualDue} />
            <Field label={t("note")} onChange={(event) => setManualNote(event.target.value)} value={manualNote} />
            <Button disabled={!manualSupplier || !locationId} type="submit">{t("create")}</Button>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
