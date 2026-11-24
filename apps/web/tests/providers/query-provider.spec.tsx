import { expect, test } from '@playwright/test';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryProvider } from '@/components/providers/query-provider';

test('provides an isolated query client for each server render', () => {
  const clients: QueryClient[] = [];

  function Consumer() {
    clients.push(useQueryClient());
    return null;
  }

  const render = () =>
    renderToStaticMarkup(
      <QueryProvider>
        <Consumer />
      </QueryProvider>,
    );

  render();
  render();

  expect(clients).toHaveLength(2);
  expect(clients[0]).not.toBe(clients[1]);
});
