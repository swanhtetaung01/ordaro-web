"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

const nav = [
  { href: "/sales/new", key: "newSale", soon: false },
  { href: "/stock", key: "stock", soon: false },
  { href: "/products", key: "products", soon: false },
  { href: "/categories", key: "categories", soon: false },
  { href: "/suppliers", key: "suppliers", soon: false },
  { href: "/locations", key: "locations", soon: false },
  { href: "/staff", key: "staff", soon: false },
  { href: "/registers", key: "registers", soon: false },
  { href: "/settings", key: "settings", soon: false },
  { href: "/customers", key: "customers", soon: false },
  { href: "/receivables", key: "receivables", soon: false },
  { href: "/payables", key: "payables", soon: false },
  { href: "/expenses", key: "expenses", soon: false },
  { href: "/sales/held", key: "heldSales", soon: false },
] as const;

export function Shell({
  children,
  organizationName,
  userName,
}: {
  children: React.ReactNode;
  organizationName: string;
  userName: string;
}) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink md:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-3 border-b border-line bg-white px-4 py-4 md:w-60 md:border-r md:border-b-0 md:py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-button bg-indigo text-sm font-extrabold text-white">
            O
          </span>
          <span>
            <span className="block text-base font-extrabold">{t("product")}</span>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate">{t("terminal")}</span>
          </span>
        </div>
        <nav className="flex flex-1 flex-row flex-wrap gap-1 md:flex-col">
          {nav.map((item) =>
            item.soon ? (
              <span
                key={item.key}
                className="rounded-button px-2.5 py-2.5 text-sm text-slate"
                title={t("comingSoon")}
              >
                {t(item.key)}
              </span>
            ) : (
              <Link
                key={item.key}
                className={`rounded-button px-2.5 py-2.5 text-sm font-medium ${
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-indigo/10 text-indigo"
                    : "text-slate hover:bg-indigo/5 hover:text-indigo"
                }`}
                href={item.href}
              >
                {t(item.key)}
              </Link>
            ),
          )}
        </nav>
        <p className="border-t border-line pt-3 text-sm">
          <span className="block font-semibold">{userName}</span>
          <span className="text-xs text-slate">{organizationName}</span>
        </p>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const styles = {
    primary: "bg-indigo text-white",
    secondary: "border border-line bg-white text-ink",
    danger: "border border-danger text-danger",
    ghost: "text-teal",
  }[variant];
  return (
    <button
      className={`rounded-button px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        className="rounded-control border border-line bg-white px-3 py-2 font-mono text-sm outline-none focus:border-indigo disabled:bg-surface"
        {...input}
      />
      {hint ? <span className="text-xs text-slate">{hint}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...select
}: { label: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <select
        className="rounded-control border border-line bg-white px-3 py-2 text-sm outline-none focus:border-indigo disabled:bg-surface"
        {...select}
      >
        {children}
      </select>
    </label>
  );
}

export function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-panel border border-line bg-white p-5">
      {title ? <h2 className="mb-4 text-base font-bold">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Badge({ tone, children }: { tone: "ok" | "warn" | "bad" | "muted"; children: React.ReactNode }) {
  const styles = {
    ok: "bg-emerald-50 text-emerald-800",
    warn: "bg-amber-50 text-amber-800",
    bad: "text-danger",
    muted: "bg-surface text-slate",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${styles}`}>{children}</span>;
}

export function Soon({ children }: { children: React.ReactNode }) {
  const t = useTranslations("shell");
  return (
    <span className="text-xs text-slate" title={t("comingSoon")}>
      {children} · {t("comingSoon")}
    </span>
  );
}
