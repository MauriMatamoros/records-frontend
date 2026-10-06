import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TablesList } from './TablesList';

export const metadata: Metadata = { title: 'Tables' };

export default function TablesPage() {
  return (
    <Suspense>
      <TablesList />
    </Suspense>
  );
}
