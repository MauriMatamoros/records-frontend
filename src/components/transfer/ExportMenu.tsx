'use client';

import { Button, Menu, Portal } from '@chakra-ui/react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useTable } from '@/context/TableContext';
import { pluralize } from '@/lib/format';

/** Downloads the records in the current view (search, filters and sort applied). */
export function ExportMenu() {
  const { table, rows, viewParams } = useTable();
  if (!table) return null;

  const href = (format: 'csv' | 'xlsx') => {
    const p = new URLSearchParams(viewParams);
    p.delete('page');
    p.delete('pageSize');
    p.set('format', format);
    return `/api/tables/${table.id}/export?${p.toString()}`;
  };
  const total = rows?.meta.total;

  return (
    <Menu.Root positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger asChild>
        <Button size="sm" variant="outline">
          <Download /> Export
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {total !== undefined && (
              <Menu.ItemGroup>
                <Menu.ItemGroupLabel fontWeight="400" color="inkMuted">
                  {pluralize(total, 'record')} in this view
                </Menu.ItemGroupLabel>
              </Menu.ItemGroup>
            )}
            <Menu.Item value="xlsx" asChild>
              <a href={href('xlsx')} download>
                <FileSpreadsheet size={14} /> Excel (.xlsx)
              </a>
            </Menu.Item>
            <Menu.Item value="csv" asChild>
              <a href={href('csv')} download>
                <FileText size={14} /> CSV
              </a>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
