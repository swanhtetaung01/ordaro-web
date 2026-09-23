"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

const nav = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/sales/new", key: "newSale" },
  { href: "/sales", key: "salesLog" },
  { href: "/sales/held", key: "heldSales" },
  { href: "/products", key: "products" },
  { href: "/stock", key: "stock" },
  { href: "/customers", key: "customers" },
  { href: "/receivables", key: "receivables" },
  { href: "/payables", key: "payables" },
  { href: "/expenses", key: "expenses" },
  { href: "/categories", key: "categories" },
  { href: "/suppliers", key: "suppliers" },
  { href: "/locations", key: "locations" },
  { href: "/staff", key: "staff" },
  { href: "/registers", key: "registers" },
  { href: "/settings", key: "settings" },
  { href: "/account", key: "account" },
] as const;

/** The most specific item wins, so /sales/held does not also light up /sales. */
function activeHref(pathname: string) {
  return nav
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

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
  const [open, setOpen] = useState(false);
  const active = activeHref(pathname);
  const current = nav.find((item) => item.href === active);
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink md:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-3 border-b border-line bg-white px-4 py-3 md:w-60 md:border-r md:border-b-0 md:py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-button bg-indigo text-sm font-extrabold text-white">
            O
          </span>
          <span className="flex-1">
            <span className="block text-base font-extrabold">{t("product")}</span>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate">{organizationName}</span>
          </span>
          {/* on a phone the menu folds away; the page gets the screen */}
          <button
            aria-expanded={open}
            className="rounded-button border border-line px-3 py-2 text-sm font-semibold md:hidden"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? t("close") : current ? t(current.key) : t("menu")}
          </button>
        </div>
        <nav className={`${open ? "flex" : "hidden"} flex-1 flex-col gap-1 md:flex`}>
          {nav.map((item) => (
            <Link
              key={item.key}
              className={`rounded-button px-2.5 py-2.5 text-sm font-medium ${
                item.href === active ? "bg-indigo/10 text-indigo" : "text-slate hover:bg-indigo/5 hover:text-indigo"
              }`}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <p className={`${open ? "block" : "hidden"} border-t border-line pt-3 text-sm md:block`}>
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
