import { setRequestLocale } from "next-intl/server";

import { AuthFrame } from "@/components/auth-frame";
import { SignedInHome } from "@/components/session-screens";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AuthFrame>
      <SignedInHome />
    </AuthFrame>
  );
}
