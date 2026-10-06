import { Suspense } from 'react';
import { TableProvider } from '@/context/TableContext';
import { TableView } from './TableView';

export default async function TablePage({ params }: PageProps<'/tables/[tableId]'>) {
  const { tableId } = await params;
  return (
    <Suspense>
      <TableProvider tableId={tableId}>
        <TableView />
      </TableProvider>
    </Suspense>
  );
}
