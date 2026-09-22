import { setRequestLocale } from "next-intl/server";

import { ProductForm } from "@/components/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <ProductForm productId={id} />;
}
