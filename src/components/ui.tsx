"use client";

import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-2xl border border-claude-border bg-claude-card p-5 shadow-soft",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "soft";
  size?: "sm" | "md" | "icon";
}) {
  const variants = {
    primary:
      "bg-claude-accent text-white hover:bg-claude-accent-hover shadow-soft",
    ghost:
      "bg-transparent text-claude-ink-secondary hover:bg-claude-surface hover:text-claude-ink border border-transparent hover:border-claude-border",
    soft: "bg-claude-accent-soft text-claude-accent hover:bg-[#efd5c9]",
    danger: "bg-claude-danger text-white hover:bg-[#b03d3d]",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    icon: "h-10 w-10 p-0",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 ease-smooth disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "info",
  className,
}: {
  children: ReactNode;
  tone?: "info" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}) {
  const tones = {
    info: "bg-claude-info-soft text-claude-info",
    success: "bg-claude-success-soft text-claude-success",
    warning: "bg-claude-warning-soft text-claude-warning",
    danger: "bg-claude-danger-soft text-claude-danger",
    neutral: "bg-claude-surface text-claude-ink-secondary",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ViewHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-3xl font-medium tracking-tight text-claude-ink md:text-4xl"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mt-1 text-sm text-claude-ink-secondary"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {action}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
  delay = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  delay?: number;
}) {
  const bar: Record<string, string> = {
    neutral: "bg-claude-border-strong",
    success: "bg-claude-success",
    warning: "bg-claude-warning",
    danger: "bg-claude-danger",
    info: "bg-claude-info",
  };
  return (
    <Card delay={delay} className="relative overflow-hidden">
      <div className={cn("absolute left-0 top-0 h-full w-1", bar[tone])} />
      <div className="text-xs font-medium uppercase tracking-wider text-claude-ink-muted">
        {label}
      </div>
      <div className="mt-2 font-serif text-3xl font-medium tabular-nums text-claude-ink">
        {value}
      </div>
      {hint && (
        <div className="mt-2 text-xs text-claude-ink-secondary">{hint}</div>
      )}
    </Card>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-claude-border bg-claude-surface/50 px-6 py-12 text-center text-sm text-claude-ink-muted">
      {text}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-xl border border-claude-border bg-claude-card px-3 text-sm text-claude-ink placeholder:text-claude-ink-muted transition-colors focus:border-claude-accent focus:outline-none",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 rounded-xl border border-claude-border bg-claude-card px-3 text-sm text-claude-ink transition-colors focus:border-claude-accent focus:outline-none",
        props.className
      )}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-claude-ink-secondary">
      {children}
    </label>
  );
}
