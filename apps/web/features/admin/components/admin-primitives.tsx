import type { ReactNode } from 'react';
import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function AdminNotice({
  title,
  message,
  onRetry,
  retryText = 'Retry',
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>{message}</span>
        {onRetry && (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw aria-hidden="true" />
            {retryText}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function AdminLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function AdminStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'APPROVED' || status === 'VERIFIED' || status === 'PUBLISHED'
      ? 'default'
      : status === 'REJECTED' || status === 'REMOVED' || status === 'DISMISSED'
        ? 'destructive'
        : 'secondary';
  return <Badge variant={variant}>{status.replaceAll('_', ' ')}</Badge>;
}

export type AdminColumn<T> = {
  header: string;
  cell: (item: T) => ReactNode;
};

export function AdminDataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyTitle,
  emptyDescription,
}: {
  columns: AdminColumn<T>[];
  rows: T[];
  getRowKey: (item: T) => string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.header}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length ? (
          rows.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map((column) => (
                <TableCell key={column.header}>{column.cell(row)}</TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-48 whitespace-normal">
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>{emptyTitle}</EmptyTitle>
                  <EmptyDescription>{emptyDescription}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function AdminPagination({
  page,
  pageSize,
  total,
  hasNextPage,
  onPageChange,
  summary,
  previousText,
  nextText,
}: {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  summary: string;
  previousText: string;
  nextText: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">{summary}</p>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              text={previousText}
              aria-disabled={page <= 1}
              onClick={(event) => {
                event.preventDefault();
                if (page > 1) onPageChange(page - 1);
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              text={nextText}
              aria-disabled={!hasNextPage}
              onClick={(event) => {
                event.preventDefault();
                if (hasNextPage) onPageChange(page + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export function formatAdminDate(value: string | null, locale: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export function formatAdminEnum(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}
