'use client';

import { Badge, Box, Button, Flex, HStack, IconButton, Link, Skeleton, Stack, Text } from '@chakra-ui/react';
import { ArrowDownAZ, ArrowUpAZ, ChevronLeft, Plus, Settings2, Upload, X } from 'lucide-react';
import NextLink from 'next/link';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ApiAccessPopover } from '@/components/grid/ApiAccessPopover';
import { ColumnDialog } from '@/components/grid/ColumnDialog';
import { FilterBuilder } from '@/components/grid/FilterBuilder';
import { RecordDialog } from '@/components/grid/RecordDialog';
import { RecordsGrid } from '@/components/grid/RecordsGrid';
import { TableSettingsDialog } from '@/components/grid/TableSettingsDialog';
import { PageHeader } from '@/components/PageHeader';
import { PaginationBar } from '@/components/PaginationBar';
import { SearchInput } from '@/components/SearchInput';
import { ExportMenu } from '@/components/transfer/ExportMenu';
import { ImportDialog } from '@/components/transfer/ImportDialog';
import { toastError, toaster } from '@/components/ui/toaster';
import { useTable } from '@/context/TableContext';
import { api, ApiError } from '@/lib/api';
import type { Column, Row } from '@/lib/types';

export function TableView() {
  const { table, tableError, rows, view, setView, refresh } = useTable();

  const [columnDialog, setColumnDialog] = useState<{ open: boolean; column: Column | null }>({ open: false, column: null });
  const [recordDialog, setRecordDialog] = useState<{ open: boolean; row: Row | null }>({ open: false, row: null });
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterSeed, setFilterSeed] = useState<{ column: Column; at: number } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (tableError instanceof ApiError && tableError.status === 404) {
    return (
      <Stack gap="3" align="flex-start">
        <Text fontSize="xl" fontWeight="600">
          This table doesn’t exist or was deleted.
        </Text>
        <Link asChild color="ledger.fg">
          <NextLink href="/tables">Back to tables</NextLink>
        </Link>
      </Stack>
    );
  }
  if (!table) {
    return (
      <Stack gap="4">
        <Skeleton h="10" w="64" />
        <Skeleton h="80" />
      </Stack>
    );
  }

  const sortColumn = view.sort ? table.columns.find((c) => c.key === view.sort.replace(/^-/, '')) : undefined;
  const sortLabel =
    view.sort.replace(/^-/, '') === 'updatedAt' ? 'Last changed' : view.sort.replace(/^-/, '') === 'createdAt' ? 'Date added' : sortColumn?.name;

  async function deleteRow(row: Row) {
    try {
      await api(`/api/tables/${table!.id}/rows/${row.id}`, { method: 'DELETE' });
      toaster.create({ type: 'success', title: 'Record deleted' });
      refresh();
    } catch (err) {
      toastError(err, 'Could not delete the record');
    }
  }

  return (
    <Box>
      <title>{`${table.name} · Records`}</title>
      <Link asChild color="inkMuted" textStyle="sm" mb="2" display="inline-flex" alignItems="center" gap="1">
        <NextLink href="/tables">
          <ChevronLeft size={14} /> Tables
        </NextLink>
      </Link>
      <PageHeader
        title={table.name}
        description={table.description ?? undefined}
        actions={
          <>
            <ApiAccessPopover />
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload /> Import
            </Button>
            <ExportMenu />
            <IconButton aria-label="Table settings" size="sm" variant="outline" onClick={() => setSettingsOpen(true)}>
              <Settings2 />
            </IconButton>
          </>
        }
      />

      <Flex gap="2" mb="3" align="center" wrap="wrap">
        <SearchInput value={view.q} onChange={(q) => setView({ q })} placeholder="Search records" />
        <FilterBuilder
          open={filterOpen}
          onOpenChange={setFilterOpen}
          seed={filterSeed}
        />
        {view.sort && sortLabel && (
          <Badge size="lg" variant="subtle" colorPalette="ledger" gap="1.5" pe="1">
            {view.sort.startsWith('-') ? <ArrowUpAZ size={13} /> : <ArrowDownAZ size={13} />}
            Sorted by {sortLabel}
            <IconButton aria-label="Clear sort" size="2xs" variant="ghost" onClick={() => setView({ sort: '' })}>
              <X />
            </IconButton>
          </Badge>
        )}
        <HStack ms="auto" gap="2">
          <Button size="sm" variant="outline" onClick={() => setColumnDialog({ open: true, column: null })}>
            <Plus /> Column
          </Button>
          <Button size="sm" colorPalette="ledger" onClick={() => setRecordDialog({ open: true, row: null })}>
            <Plus /> Record
          </Button>
        </HStack>
      </Flex>

      {table.columns.length === 0 ? (
        <Stack
          align="center"
          gap="3"
          py="16"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="rule"
          rounded="lg"
          bg="surface"
        >
          <Text fontWeight="600">This table has no columns yet</Text>
          <Text color="inkMuted" textStyle="sm">
            Add columns by hand, or import a spreadsheet whose headers match.
          </Text>
          <Button size="sm" colorPalette="ledger" onClick={() => setColumnDialog({ open: true, column: null })}>
            <Plus /> Add column
          </Button>
        </Stack>
      ) : (
        <RecordsGrid
          onEditColumn={(column) => setColumnDialog({ open: true, column })}
          onOpenRow={(row) => setRecordDialog({ open: true, row })}
          onDeleteRow={setDeleting}
          onFilterColumn={(column) => {
            setFilterSeed({ column, at: Date.now() });
            setFilterOpen(true);
          }}
        />
      )}

      <PaginationBar
        meta={rows?.meta}
        noun="records"
        onPageChange={(page) => setView({ page })}
        onPageSizeChange={(pageSize) => setView({ pageSize })}
      />

      <ColumnDialog
        open={columnDialog.open}
        column={columnDialog.column}
        onOpenChange={(open) => setColumnDialog((s) => ({ ...s, open }))}
      />
      <RecordDialog
        open={recordDialog.open}
        row={recordDialog.row}
        onOpenChange={(open) => setRecordDialog((s) => ({ ...s, open }))}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <TableSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this record?"
        description="The record is removed for everyone, including services reading it through the API. The change is kept in the activity log."
        confirmLabel="Delete record"
        onConfirm={() => (deleting ? deleteRow(deleting) : undefined)}
      />
    </Box>
  );
}
