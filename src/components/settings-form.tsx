"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Field, PageHeader, Panel, SelectField } from "@/components/ui";
import type { Schemas } from "@/lib/backend";
import { readJson } from "@/lib/read-json";

type Org = Schemas["OrganizationView"];

export function SettingsForm() {
  const t = useTranslations("settings");
  const errors = useTranslations("errors");
  const [org, setOrg] = useState<Org>();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void readJson<Org>("/api/catalog/organization").then(setOrg);
  }, []);

  if (!org) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={t("title")} subtitle={org.slug} />
      <Panel>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(undefined);
            setSaved(false);
            try {
              const next = await readJson<Org>("/api/org/organization", {
                method: "PATCH",
                body: JSON.stringify({
                  name: form.get("name"),
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
            }
          }}
        >
          <Field defaultValue={org.name} label={t("name")} name="name" required />
          <Field defaultValue={org.currencyCode} label={t("currency")} maxLength={3} name="currencyCode" />
          <Field defaultValue={org.timezone} label={t("timezone")} name="timezone" />
          <SelectField defaultValue={org.businessType} disabled label={t("type")} name="businessType">
            <option value={org.businessType}>{org.businessType}</option>
          </SelectField>
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked={org.taxInclusivePricing} name="taxInclusive" type="checkbox" />
            {t("taxInclusive")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked={org.allowNegativeStock} name="negative" type="checkbox" />
            {t("negative")}
          </label>
          <Button type="submit">{t("save")}</Button>
        </form>
        <p className="mt-3 text-xs text-slate">{t("costing")}: {org.costingMethod}</p>
      </Panel>
      {saved ? <p className="text-sm text-teal">{t("saved")}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
