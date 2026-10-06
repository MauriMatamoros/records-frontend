import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LogsView } from './LogsView';

export const metadata: Metadata = { title: 'Activity log' };

export default function LogsPage() {
  return (
    <Suspense>
      <LogsView />
    </Suspense>
  );
}
