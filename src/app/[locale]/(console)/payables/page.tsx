import { setRequestLocale } from "next-intl/server";

import { PayableDesk } from "@/components/payable-desk";

export default async function PayablesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { locale } = await params;
  const { id } = await searchParams;
  setRequestLocale(locale);
  return <PayableDesk initialId={id} />;
}
