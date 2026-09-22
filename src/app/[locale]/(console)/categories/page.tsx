import { setRequestLocale } from "next-intl/server";

import { CategoryManager } from "@/components/category-manager";

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CategoryManager />;
}
