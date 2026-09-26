"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Alert, Button, Checkbox, Field, Page, PageHeader, PageLoading, Panel, SelectField } from "@/components/ui";
import type { Schemas } from "@/lib/backend";
import { useCodes } from "@/lib/codes";
import { readJson } from "@/lib/read-json";

type Org = Schemas["OrganizationView"];

const businessTypes = ["RETAIL", "ONLINE", "WHOLESALE", "DISTRIBUTOR", "MULTI_BRANCH", "FNB", "SERVICE", "RENTAL", "OTHER"] as const;

export function SettingsForm() {
  const t = useTranslations("settings");
  const errors = useTranslations("errors");
  const codes = useCodes();
  const [org, setOrg] = useState<Org>();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void readJson<Org>("/api/catalog/organization").then(setOrg);
  }, []);

  if (!org) {
    return <PageLoading panels={3} />;
  }

  return (
    <Page width="narrow">
      <PageHeader subtitle={t("subtitle")} title={t("title")} />
      <form
        className="flex flex-col gap-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(undefined);
          setSaved(false);
          setPending(true);
          try {
            const next = await readJson<Org>("/api/org/organization", {
              method: "PATCH",
              body: JSON.stringify({
                name: form.get("name"),
                businessType: form.get("businessType"),
                defaultCreditLimit: form.get("defaultCreditLimit") || "0",
                defaultCreditTermDays: Number(form.get("defaultCreditTermDays") || 0),
                defaultTaxRate: form.get("defaultTaxRate") || "0",
                roundTotalToNearest: form.get("roundTotalToNearest") || undefined,
                currencyCode: form.get("currencyCode"),
                timezone: form.get("timezone"),
                taxInclusivePricing: form.get("taxInclusive") === "on",
                allowNegativeStock: form.get("negative") === "on",
              }),
            });
            setOrg(next);
            setSaved(true);
          } catch (caught) {
            const code = caught instanceof Error ? caught.message : "unknown";
            setError(errors.has(code) ? errors(code) : errors("unknown"));
          } finally {
            setPending(false);
          }
        }}
      >
        <Panel title={t("business")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" defaultValue={org.name} label={t("name")} name="name" required />
            <SelectField defaultValue={org.businessType} label={t("type")} name="businessType">
              {businessTypes.map((value) => (
                <option key={value} value={value}>{t(`types.${value}`)}</option>
              ))}
            </SelectField>
            <Field defaultValue={org.currencyCode} label={t("currency")} maxLength={3} name="currencyCode" />
            <Field className="sm:col-span-2" defaultValue={org.timezone} hint={t("timezoneHint")} label={t("timezone")} name="timezone" />
          </div>
        </Panel>

        <Panel title={t("prices")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field defaultValue={String(org.defaultTaxRate ?? 0)} hint={t("taxRateHint")} inputMode="decimal"
              label={t("taxRate")} name="defaultTaxRate" />
            <Field defaultValue={org.roundTotalToNearest ? String(org.roundTotalToNearest) : ""} hint={t("roundHint")}
              inputMode="decimal" label={t("round")} name="roundTotalToNearest" />
          </div>
          <div className="mt-4">
            <Checkbox defaultChecked={org.taxInclusivePricing} label={t("taxInclusive")} name="taxInclusive" />
          </div>
        </Panel>

        <Panel title={t("credit")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field defaultValue={String(org.defaultCreditLimit ?? 0)} hint={t("creditLimitHint")} inputMode="decimal"
              label={t("creditLimit")} name="defaultCreditLimit" />
            <Field defaultValue={String(org.defaultCreditTermDays ?? 0)} hint={t("creditTermHint")} inputMode="numeric"
              label={t("creditTerm")} max={365} min={0} name="defaultCreditTermDays" type="number" />
          </div>
        </Panel>

        <Panel title={t("stock")}>
          <Checkbox defaultChecked={org.allowNegativeStock} hint={t("negativeHint")} label={t("negative")} name="negative" />
          <p className="mt-4 text-sm text-slate">
            {t("costing")}: <span className="font-medium text-ink">{codes("costing", org.costingMethod)}</span>
          </p>
        </Panel>

        {/* Save stays within reach at the bottom, above the phone's tab bar */}
        <div className="sticky bottom-16 z-10 -mx-4 flex flex-col gap-2 border-t border-line bg-white/95 px-4 pt-4 pb-4 backdrop-blur sm:-mx-8 sm:px-8 md:bottom-0">
          {error ? <Alert>{error}</Alert> : null}
          {saved ? <Alert tone="success">{t("saved")}</Alert> : null}
          <Button busy={pending} className="self-end" type="submit">{t("save")}</Button>
        </div>
      </form>
    </Page>
  );
}
