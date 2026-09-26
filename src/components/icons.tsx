/** A few line icons, drawn on a 24px grid in the text colour. Decorative: screen readers skip them. */
type IconProps = { className?: string };

function Svg({ className = "size-5", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return <Svg {...props}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>;
}

export function CloseIcon(props: IconProps) {
  return <Svg {...props}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
}

export function ChevronDownIcon(props: IconProps) {
  return <Svg {...props}><path d="m6 9 6 6 6-6" /></Svg>;
}

export function PlusIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 5v14M5 12h14" /></Svg>;
}

export function SearchIcon(props: IconProps) {
  return <Svg {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>;
}

export function AlertIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16.5h.01" /></Svg>;
}

export function CheckCircleIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></Svg>;
}

export function InfoIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5h.01" /></Svg>;
}

export function LogoutIcon(props: IconProps) {
  return <Svg {...props}><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="m16 16 4-4-4-4M20 12H9" /></Svg>;
}

export function GlobeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="m6 7 1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </Svg>
  );
}

export function BoxIcon(props: IconProps) {
  return <Svg {...props}><path d="M21 8 12 3 3 8v8l9 5 9-5Z" /><path d="m3 8 9 5 9-5M12 13v8" /></Svg>;
}

export function ReceiptIcon(props: IconProps) {
  return <Svg {...props}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6M9 12h6" /></Svg>;
}

export function CartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return <Svg {...props}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
}

export function ArrowDownIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 5v14M6 13l6 6 6-6" /></Svg>;
}

export function HomeIcon(props: IconProps) {
  return <Svg {...props}><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10M10 20v-6h4v6" /></Svg>;
}

export function UsersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20v-1a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v1M16 4.3a3.5 3.5 0 0 1 0 7.4M21.5 20v-1a4 4 0 0 0-3-3.9" />
    </Svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7a2 2 0 0 1 2-2h11v4" />
      <path d="M4 7v10a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H6a2 2 0 0 1-2-2ZM16 14h.01" />
    </Svg>
  );
}

/** Settings, drawn as sliders. */
export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Svg>
  );
}

/** "More": four tiles. */
export function MoreIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect height="6" rx="1.5" width="6" x="4" y="4" />
      <rect height="6" rx="1.5" width="6" x="14" y="4" />
      <rect height="6" rx="1.5" width="6" x="4" y="14" />
      <rect height="6" rx="1.5" width="6" x="14" y="14" />
    </Svg>
  );
}

export function UserIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></Svg>;
}

export function CheckIcon(props: IconProps) {
  return <Svg {...props}><path d="m5 12.5 4.5 4.5L19 7" /></Svg>;
}

export function ChevronUpDownIcon(props: IconProps) {
  return <Svg {...props}><path d="m8 9 4-4 4 4M16 15l-4 4-4-4" /></Svg>;
}

export function Spinner({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" fill="currentColor" />
    </svg>
  );
}
