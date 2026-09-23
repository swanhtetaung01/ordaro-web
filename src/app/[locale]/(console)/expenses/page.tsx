import { setRequestLocale } from "next-intl/server";

import { ExpenseDesk } from "@/components/expense-desk";

export default async function ExpensesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ExpenseDesk />;
}
