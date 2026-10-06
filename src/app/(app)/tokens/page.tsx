import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TokensView } from './TokensView';

export const metadata: Metadata = { title: 'API tokens' };

export default function TokensPage() {
  return (
    <Suspense>
      <TokensView />
    </Suspense>
  );
}
