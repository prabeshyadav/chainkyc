import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-accent-600 text-white hover:bg-accent-700",
    secondary: "bg-white text-ink-900 border border-line hover:bg-gray-50",
    ghost: "text-ink-600 hover:text-ink-900",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-line rounded-xl ${className}`}>
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-display font-semibold text-ink-900">{title}</h3>
          {description && (
            <p className="text-sm text-ink-600 mt-0.5">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

type BadgeTone = "default" | "accent" | "success" | "warning" | "danger";

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const tones: Record<BadgeTone, string> = {
    default: "bg-gray-100 text-ink-600",
    accent: "bg-accent-50 text-accent-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-600",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function TopBar({
  roleLabel,
  address,
  onLogout,
}: {
  roleLabel?: string;
  address?: string;
  onLogout?: () => void;
}) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between px-30 py-4 border-b border-line bg-white">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 font-display font-semibold text-ink-900"
      >
        <ShieldCheck size={20} className="text-accent-600" />
        VerifyChain
      </button>
      {roleLabel && (
        <div className="flex items-center gap-3">
          <Badge tone="accent">
            {roleLabel}{" "}
            {address && <span className="font-mono">{address}</span>}
          </Badge>
          {onLogout && (
            <Button variant="primary" onClick={onLogout}>
              Log Out
            </Button>
          )}
        </div>
      )}
    </header>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function Input({ label, hint, ...props }: InputProps) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-900 mb-1.5">
        {label}
      </span>
      <input
        className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-600 focus:border-transparent"
        placeholder={hint}
        {...props}
      />
    </label>
  );
}
