import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ProfileCard({ title, description, children }: {
  title: string; description?: string; children: ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-auth-border bg-auth-surface shadow-sm">
      <CardHeader className="border-b border-auth-border/80 px-6 py-5">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5 px-6 py-6">{children}</CardContent>
    </Card>
  );
}
