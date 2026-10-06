'use client';

import { Box, Button, EmptyState, HStack, Link, Skeleton, Stack, Table, Text } from '@chakra-ui/react';
import { Plus, Table2 } from 'lucide-react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';
import { PageHeader } from '@/components/PageHeader';
import { PaginationBar } from '@/components/PaginationBar';
import { SearchInput } from '@/components/SearchInput';
import { CreateTableDialog } from '@/components/tables/CreateTableDialog';
import { withQuery } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import type { Paginated, TableSummary } from '@/lib/types';
import { useUrlState } from '@/lib/useUrlState';

export function TablesList() {
  const router = useRouter();
  const { get, set, page } = useUrlState();
  const q = get('q');
  const pageSize = Number(get('pageSize')) || 25;
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useSWR<Paginated<TableSummary>>(
    withQuery('/api/tables', { page, pageSize, q }),
  );

  return (
    <Box maxW="6xl">
      <PageHeader
        title="Tables"
        description="Shared records that people edit here and internal services read through the API."
        actions={
          <Button colorPalette="ledger" size="sm" onClick={() => setCreating(true)}>
            <Plus /> New table
          </Button>
        }
      />

      <HStack mb="4">
        <SearchInput value={q} onChange={(v) => set({ q: v })} placeholder="Search tables" />
      </HStack>

      {isLoading && !data ? (
        <Stack gap="2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} h="12" />
          ))}
        </Stack>
      ) : data && data.items.length === 0 ? (
        <EmptyState.Root borderWidth="1px" borderColor="rule" borderStyle="dashed" rounded="lg" bg="surface">
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Table2 />
            </EmptyState.Indicator>
            <EmptyState.Title>{q ? `No tables match “${q}”` : 'No tables yet'}</EmptyState.Title>
            <EmptyState.Description>
              {q ? 'Try a different search.' : 'Create one from scratch or from a CSV or Excel file.'}
            </EmptyState.Description>
            {!q && (
              <Button colorPalette="ledger" size="sm" onClick={() => setCreating(true)}>
                <Plus /> New table
              </Button>
            )}
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <Table.ScrollArea borderWidth="1px" borderColor="rule" rounded="lg" bg="surface">
          <Table.Root size="md" interactive>
            <Table.Header>
              <Table.Row bg="canvas">
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>API slug</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Columns</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Records</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Last changed</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data?.items.map((t) => (
                <Table.Row
                  key={t.id}
                  cursor="pointer"
                  onClick={() => router.push(`/tables/${t.id}`)}
                  _hover={{ bg: 'rowHover' }}
                >
                  <Table.Cell>
                    <Link asChild fontWeight="600" color="ink" onClick={(e) => e.stopPropagation()}>
                      <NextLink href={`/tables/${t.id}`}>{t.name}</NextLink>
                    </Link>
                    {t.description && (
                      <Text textStyle="sm" color="inkMuted" lineClamp={1} maxW="lg">
                        {t.description}
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell fontFamily="mono" fontSize="xs" color="inkMuted">
                    {t.slug}
                  </Table.Cell>
                  <Table.Cell textAlign="end">{t.columnCount}</Table.Cell>
                  <Table.Cell textAlign="end">{t.rowCount.toLocaleString()}</Table.Cell>
                  <Table.Cell textAlign="end" color="inkMuted" whiteSpace="nowrap">
                    {timeAgo(t.updatedAt)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      )}

      <PaginationBar
        meta={data?.meta}
        noun="tables"
        onPageChange={(p) => set({ page: p })}
        onPageSizeChange={(s) => set({ pageSize: s })}
      />

      <CreateTableDialog open={creating} onOpenChange={setCreating} />
    </Box>
  );
}
