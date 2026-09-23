"use client";

import { useTranslations } from "next-intl";

import { PageHeader, Panel, Soon } from "@/components/ui";

export function HeldSales() {
  const t = useTranslations("held");
  return (
    <div className="flex flex-col gap-5 p-4 sm:p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Panel>
        <Soon>{t("noList")}</Soon>
      </Panel>
    </div>
  );
}
