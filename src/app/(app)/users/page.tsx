import type { Metadata } from 'next';
import { Suspense } from 'react';
import { UsersView } from './UsersView';

export const metadata: Metadata = { title: 'People' };

export default function UsersPage() {
  return (
    <Suspense>
      <UsersView />
    </Suspense>
  );
}
