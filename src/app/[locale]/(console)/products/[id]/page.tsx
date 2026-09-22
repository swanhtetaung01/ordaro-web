import { setRequestLocale } from "next-intl/server";

import { ProductDetail } from "@/components/product-detail";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <ProductDetail productId={id} />;
}
