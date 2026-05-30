import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

const shellStyle: CSSProperties = {
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.08)",
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.04) 100%)",
  boxShadow: "0 32px 80px rgba(4, 10, 20, 0.35)",
  backdropFilter: "blur(20px)",
  color: "#f7f3ed"
};

export type ShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, subtitle, actions, children }: ShellProps) {
  return (
    <section style={{ ...shellStyle, padding: "clamp(1.25rem, 2vw, 2rem)" }}>
      <header style={{ display: "flex", gap: 16, justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ margin: 0, color: "rgba(247,243,237,0.6)", textTransform: "uppercase", letterSpacing: "0.18em", fontSize: 12 }}>
            ASUR Commerce Platform
          </p>
          <h2 style={{ margin: "0.35rem 0 0", fontSize: "clamp(1.8rem, 4vw, 3rem)", lineHeight: 1.05 }}>{title}</h2>
          {subtitle ? <p style={{ margin: "0.6rem 0 0", maxWidth: 720, color: "rgba(247,243,237,0.74)" }}>{subtitle}</p> : null}
        </div>
        {actions ? <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "flex-end" }}>{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

export type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article
      style={{
        borderRadius: 24,
        padding: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(10, 16, 28, 0.45)"
      }}
    >
      <p style={{ margin: 0, color: "rgba(247,243,237,0.62)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</p>
      <div style={{ marginTop: 10, fontSize: "clamp(1.6rem, 3vw, 2.5rem)", fontWeight: 700 }}>{value}</div>
      {detail ? <p style={{ margin: "0.4rem 0 0", color: "rgba(247,243,237,0.7)" }}>{detail}</p> : null}
    </article>
  );
}

export type PillProps = {
  tone?: "neutral" | "success" | "warning" | "info";
  children: ReactNode;
};

export function Pill({ tone = "neutral", children }: PillProps) {
  const palette: Record<NonNullable<PillProps["tone"]>, CSSProperties> = {
    neutral: { background: "rgba(255,255,255,0.08)", color: "#f7f3ed" },
    success: { background: "rgba(22, 163, 74, 0.18)", color: "#bbf7d0" },
    warning: { background: "rgba(245, 158, 11, 0.18)", color: "#fde68a" },
    info: { background: "rgba(59, 130, 246, 0.18)", color: "#bfdbfe" }
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "0.45rem 0.8rem",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        ...palette[tone]
      }}
    >
      {children}
    </span>
  );
}

type ButtonBaseProps = {
  variant?: "primary" | "ghost";
  children: ReactNode;
};

type AnchorButtonProps = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
    href: string;
  };

type NativeButtonProps = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

export type ButtonProps = AnchorButtonProps | NativeButtonProps;

export function Button({ href, variant = "primary", children, ...props }: ButtonProps) {
  const styles: Record<NonNullable<ButtonProps["variant"]>, CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, #f97316, #fb7185)",
      color: "#130f0b",
      border: "none"
    },
    ghost: {
      background: "transparent",
      color: "#f7f3ed",
      border: "1px solid rgba(255,255,255,0.14)"
    }
  };

  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    padding: "0.85rem 1.15rem",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    cursor: "pointer",
    transition: "transform 180ms ease, opacity 180ms ease"
  };

  if (href) {
    const anchorProps = props as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">;
    return (
      <a style={{ ...base, ...styles[variant] }} href={href} {...anchorProps}>
        {children}
      </a>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" style={{ ...base, ...styles[variant] }} {...buttonProps}>
      {children}
    </button>
  );
}

export type TimelineProps = {
  steps: Array<{ title: string; description: string; tone?: "neutral" | "success" | "warning" | "info" }>;
};

export function Timeline({ steps }: TimelineProps) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {steps.map((step) => (
        <article
          key={step.title}
          style={{
            display: "grid",
            gap: 6,
            gridTemplateColumns: "auto 1fr",
            alignItems: "start",
            borderRadius: 24,
            padding: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)"
          }}
        >
          <Pill tone={step.tone ?? "neutral"}>{step.title}</Pill>
          <p style={{ margin: 0, color: "rgba(247,243,237,0.76)" }}>{step.description}</p>
        </article>
      ))}
    </div>
  );
}
