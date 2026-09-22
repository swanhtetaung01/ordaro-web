import { getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/language-switcher";

export async function AuthFrame({ children }: { children: React.ReactNode }) {
  const brand = await getTranslations("brand");
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold tracking-tight text-indigo">{brand("name")}</p>
        <LanguageSwitcher />
      </div>
      <section className="rounded-panel border border-line bg-white p-6 shadow-sm">{children}</section>
    </main>
  );
}
