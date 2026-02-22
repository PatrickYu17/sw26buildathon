import type { ButtonHTMLAttributes, ReactNode } from "react";

type PageShellProps = {
  title: ReactNode;
  subtitle?: string;
  children?: ReactNode;
  actions?: ReactNode;
  hero?: ReactNode;
  titleAccessory?: ReactNode;
  titleClassName?: string;
};

export function PageShell({ 
  title, 
  subtitle, 
  children, 
  actions,
  hero,
  titleAccessory,
  titleClassName = "text-xl",
}: PageShellProps) {
  return (
    <main className="w-full pt-6">
      {hero && (
        <div className="mb-6 rounded-none overflow-hidden bg-linear-to-br from-accent-light via-accent-warm to-rose-light">
          {hero}
        </div>
      )}
      <header className="mb-5 flex flex-col gap-3 rounded-xl border border-border/70 bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={`${titleClassName} font-semibold text-foreground`}>
              {title}
            </h1>
            {titleAccessory}
          </div>
          {subtitle && (
            <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3 sm:shrink-0">{actions}</div>}
      </header>
      {children}
    </main>
  );
}

type HeroProps = {
  children?: ReactNode;
  className?: string;
};

export function Hero({ children, className = "" }: HeroProps) {
  return (
    <div className={`relative h-40 sm:h-48 flex items-center justify-center p-6 ${className}`}>
      {children}
    </div>
  );
}

type PanelProps = {
  children: ReactNode;
  className?: string;
  decoration?: ReactNode;
};

export function Panel({ children, className = "", decoration }: PanelProps) {
  return (
    <div className={`relative bg-white rounded-none border border-border overflow-hidden ${className}`}>
      {decoration && (
        <div className="absolute top-0 right-0 opacity-20 pointer-events-none">
          {decoration}
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

type PanelHeaderProps = {
  children: ReactNode;
  action?: ReactNode;
};

export function PanelHeader({ children, action }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-accent-light/50 px-4 py-3 rounded-none">
      <span className="text-sm font-medium text-foreground">{children}</span>
      {action}
    </div>
  );
}

type PanelBodyProps = {
  children: ReactNode;
  className?: string;
};

export function PanelBody({ children, className = "" }: PanelBodyProps) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
}

type PanelRowProps = {
  children: ReactNode;
  className?: string;
};

export function PanelRow({ children, className = "" }: PanelRowProps) {
  return (
    <div className={`border-b border-border/50 last:border-b-0 ${className}`}>
      {children}
    </div>
  );
}

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-light text-accent">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-text-muted max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  className?: string;
};

export function Button({ 
  children, 
  variant = "primary", 
  size = "md",
  className = "",
  type = "button",
  ...buttonProps
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-full transition-colors";
  
  const variantClasses = {
    primary: "bg-accent text-white hover:bg-accent-muted",
    secondary: "bg-accent-light text-foreground hover:bg-accent-muted hover:text-white",
    ghost: "text-accent hover:bg-accent-light",
  };
  
  const sizeClasses = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-5 py-2 text-sm",
  };
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
};

export function Card({ children, className = "", padding = "md" }: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
  };
  
  return (
    <div className={`rounded-none border border-border bg-white ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

type CardGroupProps = {
  children: ReactNode;
  className?: string;
};

export function CardGroup({ children, className = "" }: CardGroupProps) {
  return (
    <div className={`rounded-none border border-border bg-white overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

type SectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
};

export function Section({ title, description, children, action }: SectionProps) {
  return (
    <section>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && <h2 className="text-base font-medium text-foreground">{title}</h2>}
            {description && <p className="text-sm text-text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
};

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-none bg-accent-light/40 border border-border/50">
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-accent">
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
