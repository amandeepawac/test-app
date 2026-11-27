import type { ReactNode } from 'react';

export function ProfileField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-auth-foreground">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-auth-muted">{hint}</span>}
    </label>
  );
}

export const profileInputClass =
  'h-11 w-full rounded-lg border border-auth-border bg-auth-canvas px-3.5 text-sm text-auth-foreground outline-none transition placeholder:text-auth-muted/70 focus:border-auth-primary focus:ring-4 focus:ring-auth-primary/10';
export const profileTextAreaClass =
  'min-h-28 w-full rounded-lg border border-auth-border bg-auth-canvas px-3.5 py-3 text-sm text-auth-foreground outline-none transition placeholder:text-auth-muted/70 focus:border-auth-primary focus:ring-4 focus:ring-auth-primary/10';
