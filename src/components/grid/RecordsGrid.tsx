'use client';

import {
  Box,
  Checkbox,
  Flex,
  HStack,
  IconButton,
  Menu,
  Portal,
  Skeleton,
  Table,
  Text,
} from '@chakra-ui/react';
import {
  ArrowDownAZ,
  ArrowLeft,
  ArrowRight,
  ArrowUpAZ,
  ChevronDown,
  Filter,
  KeyRound,
  Maximize2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useTable } from '@/context/TableContext';
import { api } from '@/lib/api';
import { columnTypeInfo } from '@/lib/columnTypes';
import type { Column, Row } from '@/lib/types';
import { toastError } from '../ui/toaster';
import { CellEditor } from './CellEditor';
import { CellValue } from './CellValue';

const WIDTH: Record<Column['type'], string> = {
  TEXT: '200px',
  LONG_TEXT: '280px',
  NUMBER: '120px',
  BOOLEAN: '96px',
  DATE: '140px',
  SELECT: '150px',
  MULTI_SELECT: '220px',
  URL: '220px',
  EMAIL: '220px',
};
const LINE_COL = '56px';

interface Props {
  onEditColumn: (column: Column | null) => void;
  onOpenRow: (row: Row | null) => void;
  onDeleteRow: (row: Row) => void;
  onFilterColumn: (column: Column) => void;
}

export function RecordsGrid({ onEditColumn, onOpenRow, onDeleteRow, onFilterColumn }: Props) {
  const { table, rows, rowsLoading, view, setView, updateRow, mutateTable } = useTable();
  const [editing, setEditing] = useState<{ rowId: string; key: string } | null>(null);

  if (!table) return null;
  const columns = table.columns;
  const firstLine = (view.page - 1) * view.pageSize + 1;

  async function move(column: Column, delta: -1 | 1) {
    const ids = columns.map((c) => c.id);
    const i = ids.indexOf(column.id);
    const j = i + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    try {
      await api(`/api/tables/${table!.id}/columns/order`, { method: 'PUT', body: { columnIds: ids } });
      await mutateTable();
    } catch (err) {
      toastError(err, 'Could not move the column');
    }
  }

  const sortDir = (key: string) =>
    view.sort === key ? 'asc' : view.sort === `-${key}` ? 'desc' : null;

  const pinned = (col: Column) => col.primary;

  return (
    <Box
      borderWidth="1px"
      borderColor="rule"
      rounded="lg"
      bg="surface"
      overflow="auto"
      maxH="calc(100dvh - 300px)"
      minH="64"
    >
      <Table.Root
        size="sm"
        stickyHeader
        tableLayout="fixed"
        w="max-content"
        minW="full"
        css={{
          '& td, & th': { borderColor: 'rule', borderBottomWidth: '1px', borderRightWidth: '1px' },
          '& tbody tr:hover > td': { bg: 'rowHover' },
        }}
      >
        <Table.ColumnGroup>
          <Table.Column w={LINE_COL} />
          {columns.map((c) => (
            <Table.Column key={c.id} w={WIDTH[c.type]} />
          ))}
          <Table.Column w="48px" />
        </Table.ColumnGroup>

        <Table.Header>
          <Table.Row bg="surface">
            <Table.ColumnHeader
              position="sticky"
              left="0"
              zIndex="3"
              bg="surface"
              borderRightStyle="double !important"
              borderRightWidth="3px !important"
              borderRightColor="marginRule !important"
            >
              <Text srOnly>Line</Text>
            </Table.ColumnHeader>
            {columns.map((c) => {
              const info = columnTypeInfo(c.type);
              const dir = sortDir(c.key);
              return (
                <Table.ColumnHeader
                  key={c.id}
                  bg="surface"
                  px="2"
                  py="1.5"
                  position={pinned(c) ? 'sticky' : undefined}
                  left={pinned(c) ? LINE_COL : undefined}
                  zIndex={pinned(c) ? 3 : undefined}
                  aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : undefined}
                >
                  <Menu.Root positioning={{ placement: 'bottom-start' }}>
                    <Menu.Trigger asChild>
                      <HStack
                        as="button"
                        gap="1.5"
                        w="full"
                        textAlign="start"
                        fontWeight="600"
                        color="ink"
                        cursor="pointer"
                        rounded="sm"
                        _hover={{ color: 'ledger.fg' }}
                        title={[c.name, info.label, c.primary ? 'primary key' : c.unique ? 'unique' : '', c.required && !c.primary ? 'required' : '']
                          .filter(Boolean)
                          .join(', ')}
                      >
                        <Box color={c.primary ? 'ledger.fg' : 'inkMuted'} flexShrink={0}>
                          {c.primary ? <KeyRound size={14} aria-label="Primary key" /> : <info.icon size={14} aria-hidden />}
                        </Box>
                        <Text as="span" truncate flex="1">
                          {c.name}
                          {c.required && !c.primary && (
                            <>
                              <Text as="span" color="danger" aria-hidden>
                                {' '}*
                              </Text>
                              <Text as="span" srOnly>
                                {' '}(required)
                              </Text>
                            </>
                          )}
                        </Text>
                        {dir === 'asc' && <ArrowDownAZ size={14} aria-hidden />}
                        {dir === 'desc' && <ArrowUpAZ size={14} aria-hidden />}
                        <ChevronDown size={14} aria-hidden opacity={0.5} />
                      </HStack>
                    </Menu.Trigger>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content minW="52">
                          <Menu.ItemGroup>
                            <Menu.ItemGroupLabel fontFamily="mono" fontWeight="400">
                              {c.key}
                            </Menu.ItemGroupLabel>
                          </Menu.ItemGroup>
                          <Menu.Item value="edit" onClick={() => onEditColumn(c)}>
                            <Pencil size={14} /> Edit column
                          </Menu.Item>
                          <Menu.Item value="asc" onClick={() => setView({ sort: c.key })}>
                            <ArrowDownAZ size={14} /> Sort ascending
                          </Menu.Item>
                          <Menu.Item value="desc" onClick={() => setView({ sort: `-${c.key}` })}>
                            <ArrowUpAZ size={14} /> Sort descending
                          </Menu.Item>
                          <Menu.Item value="filter" onClick={() => onFilterColumn(c)}>
                            <Filter size={14} /> Filter by this column
                          </Menu.Item>
                          <Menu.Separator />
                          <Menu.Item value="left" disabled={c.order === 0} onClick={() => move(c, -1)}>
                            <ArrowLeft size={14} /> Move left
                          </Menu.Item>
                          <Menu.Item value="right" disabled={c.id === columns.at(-1)?.id} onClick={() => move(c, 1)}>
                            <ArrowRight size={14} /> Move right
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                </Table.ColumnHeader>
              );
            })}
            <Table.ColumnHeader bg="surface" px="1">
              <IconButton aria-label="Add column" size="xs" variant="ghost" onClick={() => onEditColumn(null)}>
                <Plus />
              </IconButton>
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {rowsLoading && !rows
            ? [0, 1, 2, 3].map((i) => (
                <Table.Row key={i}>
                  <Table.Cell colSpan={columns.length + 2}>
                    <Skeleton h="5" />
                  </Table.Cell>
                </Table.Row>
              ))
            : rows?.items.map((row, i) => (
                <Table.Row key={row.id} className="group">
                  <Table.Cell
                    position="sticky"
                    left="0"
                    zIndex="1"
                    bg="surface"
                    px="1"
                    borderRightStyle="double !important"
                    borderRightWidth="3px !important"
                    borderRightColor="marginRule !important"
                  >
                    <Flex align="center" justify="space-between" gap="0.5">
                      <Text
                        textStyle="xs"
                        color="inkMuted"
                        fontVariantNumeric="tabular-nums"
                        pl="1"
                        _groupHover={{ display: 'none' }}
                      >
                        {firstLine + i}
                      </Text>
                      <HStack gap="0" display="none" _groupHover={{ display: 'flex' }}>
                        <IconButton aria-label="Open record" size="2xs" variant="ghost" onClick={() => onOpenRow(row)}>
                          <Maximize2 />
                        </IconButton>
                        <IconButton
                          aria-label="Delete record"
                          size="2xs"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => onDeleteRow(row)}
                        >
                          <Trash2 />
                        </IconButton>
                      </HStack>
                    </Flex>
                  </Table.Cell>
                  {columns.map((c) => {
                    const isEditing = editing?.rowId === row.id && editing.key === c.key;
                    const value = row.data[c.key];
                    return (
                      <Table.Cell
                        key={c.id}
                        px="2"
                        py="1"
                        h="9"
                        position={pinned(c) ? 'sticky' : 'relative'}
                        left={pinned(c) ? LINE_COL : undefined}
                        zIndex={pinned(c) ? 1 : undefined}
                        bg={pinned(c) ? 'surface' : undefined}
                        fontWeight={pinned(c) ? '500' : undefined}
                        overflow={isEditing ? 'visible' : 'hidden'}
                        cursor={c.type === 'BOOLEAN' ? 'default' : 'text'}
                        tabIndex={isEditing || c.type === 'BOOLEAN' ? undefined : 0}
                        onClick={() => c.type !== 'BOOLEAN' && setEditing({ rowId: row.id, key: c.key })}
                        onKeyDown={(e) => {
                          if (!isEditing && (e.key === 'Enter' || e.key === 'F2')) {
                            e.preventDefault();
                            setEditing({ rowId: row.id, key: c.key });
                          }
                        }}
                        _focusVisible={{ outline: '2px solid', outlineColor: 'ledger.focusRing', outlineOffset: '-2px' }}
                      >
                        {c.type === 'BOOLEAN' ? (
                          <Checkbox.Root
                            size="sm"
                            colorPalette="ledger"
                            checked={value === true}
                            onCheckedChange={(e) => updateRow(row.id, { [c.key]: !!e.checked })}
                            aria-label={c.name}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>
                        ) : isEditing ? (
                          <CellEditor
                            column={c}
                            value={value}
                            onCancel={() => setEditing(null)}
                            onCommit={(next) => {
                              setEditing(null);
                              if (JSON.stringify(next ?? null) !== JSON.stringify(value ?? null)) {
                                void updateRow(row.id, { [c.key]: next });
                              }
                            }}
                          />
                        ) : (
                          <CellValue column={c} value={value} />
                        )}
                      </Table.Cell>
                    );
                  })}
                  <Table.Cell />
                </Table.Row>
              ))}
          <Table.Row>
            <Table.Cell colSpan={columns.length + 2} p="0" borderBottomWidth="0 !important">
              <Box
                as="button"
                display="flex"
                alignItems="center"
                gap="2"
                w="full"
                px="3"
                py="2"
                color="inkMuted"
                fontSize="sm"
                textAlign="start"
                _hover={{ color: 'ledger.fg', bg: 'ledger.subtle' }}
                onClick={() => onOpenRow(null)}
              >
                <Plus size={14} /> Add record
              </Box>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
