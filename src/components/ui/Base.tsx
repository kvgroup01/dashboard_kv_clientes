import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── CARD ────────────────────────────────────────────────────
export function Card({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] border overflow-hidden transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(124,189,58,0.18)]",
        className
      )}
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── BUTTON ──────────────────────────────────────────────────
export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "var(--accent)", color: "#0c0f0a", fontWeight: 700 },
    secondary: { background: "var(--surface-2)", color: "var(--muted)", borderColor: "var(--border)" },
    outline: { background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" },
    ghost: { background: "transparent", color: "var(--muted)" },
    danger: { background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.25)" },
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(
        "rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
        "hover:-translate-y-px active:translate-y-0",
        sizes[size],
        className
      )}
      style={variants[variant]}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── INPUT ───────────────────────────────────────────────────
export function Input({ className, style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg px-4 py-2 text-sm transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-[var(--accent-dim)] focus:border-[var(--accent)]",
        className
      )}
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        color: "var(--ink)",
        ...style,
      }}
      {...props}
    />
  );
}

// ─── BADGE ───────────────────────────────────────────────────
export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "blue";
}) {
  const variants: Record<string, React.CSSProperties> = {
    default: { background: "var(--surface-2)", color: "var(--muted)", border: "1px solid var(--border)" },
    success: { background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)" },
    warning: { background: "var(--orange-dim)", color: "var(--orange)", border: "1px solid rgba(245,158,11,0.25)" },
    danger: { background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.25)" },
    blue: { background: "var(--blue-dim)", color: "var(--blue)", border: "1px solid rgba(79,142,247,0.25)" },
  };

  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-[0.08em]"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 500,
        ...variants[variant],
      }}
    >
      {children}
    </span>
  );
}

// ─── SKELETON ────────────────────────────────────────────────
export function Skeleton({ className, ...props }: { className?: string;[key: string]: any }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg", className)}
      style={{ background: "var(--surface-2)" }}
      {...props}
    />
  );
}

// ─── SPLASH SCREEN ───────────────────────────────────────────
export function SplashScreen({ message = "Iniciando sistema..." }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6"
      style={{ background: "var(--bg)" }}
    >
      <div className="relative mb-12">
        <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "var(--accent-dim)", filter: "blur(80px)" }} />
        <div
          className="relative border p-10 rounded-[3rem] shadow-2xl"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #7cbd3a, #25d366)" }}
          >
            <div className="w-10 h-10 border-[5px] border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center max-w-[200px] w-full">
        <div className="w-full h-0.5 rounded-full overflow-hidden mb-6" style={{ background: "var(--surface-2)" }}>
          <div className="h-full animate-progress" style={{ background: "var(--accent)" }} />
        </div>
        <p
          className="text-[10px] uppercase tracking-[0.3em] animate-pulse-soft text-center"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted)" }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
