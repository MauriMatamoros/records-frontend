'use client';

import {
  Badge,
  Button,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Popover,
  Portal,
  SegmentGroup,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Filter, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTable } from '@/context/TableContext';
import type { FilterCondition } from '@/lib/api';
import { operatorLabel } from '@/lib/columnTypes';
import type { Column, ColumnType, FilterOperator } from '@/lib/types';
import { useDebounced } from '@/lib/useUrlState';

type FieldType = ColumnType | 'TIMESTAMP';

const SYSTEM_FIELDS = [
  { key: 'createdAt', name: 'Date added' },
  { key: 'updatedAt', name: 'Last changed' },
];
const TIMESTAMP_OPS: FilterOperator[] = ['gte', 'lte', 'gt', 'lt'];

let nextId = 0;
const newId = () => `c${++nextId}`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Starts a new condition for this column (from a column header menu). */
  seed: { column: Column; at: number } | null;
}

export function FilterBuilder({ open, onOpenChange, seed }: Props) {
  const { table, columnTypes, view, setView } = useTable();
  const [draft, setDraft] = useState<FilterCondition[]>(view.filters);
  const [match, setMatch] = useState<'all' | 'any'>(view.match);
  const debounced = useDebounced(draft, 350);
  const lastApplied = useRef(JSON.stringify(view.filters));

  const columns = table?.columns ?? [];
  const fieldType = (key: string): FieldType =>
    SYSTEM_FIELDS.some((f) => f.key === key) ? 'TIMESTAMP' : (columns.find((c) => c.key === key)?.type ?? 'TEXT');
  const operatorsFor = (key: string): FilterOperator[] => {
    const type = fieldType(key);
    if (type === 'TIMESTAMP') return TIMESTAMP_OPS;
    return columnTypes.find((t) => t.type === type)?.operators ?? ['eq'];
  };
  const defaultOp = (key: string): FilterOperator => {
    const ops = operatorsFor(key);
    return ops.includes('contains') && fieldType(key) !== 'LONG_TEXT' ? 'contains' : ops[0];
  };

  // Seed a condition when opened from a column header (state adjusted during render).
  const [handledSeed, setHandledSeed] = useState<number | null>(null);
  if (seed && seed.at !== handledSeed && columnTypes.length > 0) {
    setHandledSeed(seed.at);
    setDraft((d) => [...d, { id: newId(), field: seed.column.key, op: defaultOp(seed.column.key), value: '' }]);
  }

  // Apply complete conditions to the view (and URL) after typing pauses.
  useEffect(() => {
    const complete = debounced.filter((f) => f.value !== '' || f.op === 'empty');
    const serialized = JSON.stringify(complete);
    if (serialized === lastApplied.current) return;
    lastApplied.current = serialized;
    setView({ filters: complete, match });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const update = (id: string, patch: Partial<FilterCondition>) =>
    setDraft((d) => d.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const activeCount = view.filters.length;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      positioning={{ placement: 'bottom-start' }}
      lazyMount
    >
      <Popover.Trigger asChild>
        <Button size="sm" variant={activeCount ? 'subtle' : 'outline'} colorPalette={activeCount ? 'ledger' : 'gray'}>
          <Filter /> Filter
          {activeCount > 0 && (
            <Badge size="sm" colorPalette="ledger" variant="solid">
              {activeCount}
            </Badge>
          )}
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content w={{ base: 'calc(100vw - 32px)', md: '2xl' }} maxW="2xl">
            <Popover.Body p="4">
              <Stack gap="3">
                {draft.length === 0 && (
                  <Text color="inkMuted" textStyle="sm">
                    No filters. Add a condition to narrow the records shown, exported and counted.
                  </Text>
                )}
                {draft.map((f, i) => {
                  const type = fieldType(f.field);
                  const column = columns.find((c) => c.key === f.field);
                  return (
                    <HStack key={f.id} gap="2" align="center" wrap={{ base: 'wrap', md: 'nowrap' }}>
                      <Text textStyle="sm" color="inkMuted" w="14" flexShrink={0}>
                        {i === 0 ? 'Where' : match === 'all' ? 'and' : 'or'}
                      </Text>
                      <NativeSelect.Root size="sm" flex="1" minW="32">
                        <NativeSelect.Field
                          aria-label="Field"
                          value={f.field}
                          onChange={(e) => {
                            const field = e.currentTarget.value;
                            update(f.id, { field, op: defaultOp(field), value: '' });
                          }}
                        >
                          {columns.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.name}
                            </option>
                          ))}
                          {SYSTEM_FIELDS.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.name}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      <NativeSelect.Root size="sm" w="40" flexShrink={0}>
                        <NativeSelect.Field
                          aria-label="Condition"
                          value={f.op}
                          onChange={(e) =>
                            update(f.id, {
                              op: e.currentTarget.value,
                              value: e.currentTarget.value === 'empty' ? 'true' : f.op === 'empty' ? '' : f.value,
                            })
                          }
                        >
                          {operatorsFor(f.field).map((op) => (
                            <option key={op} value={op}>
                              {operatorLabel(op, type)}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      <ValueInput condition={f} type={type} column={column} onChange={(value) => update(f.id, { value })} />
                      <IconButton
                        aria-label="Remove condition"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDraft((d) => d.filter((x) => x.id !== f.id))}
                      >
                        <X />
                      </IconButton>
                    </HStack>
                  );
                })}

                <HStack justify="space-between" pt="1" wrap="wrap" gap="2">
                  <HStack gap="2">
                    <Button
                      size="xs"
                      variant="ghost"
                      disabled={columns.length === 0}
                      onClick={() =>
                        setDraft((d) => [
                          ...d,
                          { id: newId(), field: columns[0].key, op: defaultOp(columns[0].key), value: '' },
                        ])
                      }
                    >
                      <Plus /> Add condition
                    </Button>
                    {draft.length > 0 && (
                      <Button size="xs" variant="ghost" onClick={() => setDraft([])}>
                        Clear all
                      </Button>
                    )}
                  </HStack>
                  {draft.length > 1 && (
                    <SegmentGroup.Root
                      size="xs"
                      value={match}
                      onValueChange={(e) => {
                        const m = e.value as 'all' | 'any';
                        setMatch(m);
                        setView({ match: m });
                      }}
                    >
                      <SegmentGroup.Indicator />
                      <SegmentGroup.Items
                        items={[
                          { value: 'all', label: 'Match all' },
                          { value: 'any', label: 'Match any' },
                        ]}
                      />
                    </SegmentGroup.Root>
                  )}
                </HStack>
              </Stack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

function ValueInput({
  condition: f,
  type,
  column,
  onChange,
}: {
  condition: FilterCondition;
  type: FieldType;
  column: Column | undefined;
  onChange: (value: string) => void;
}) {
  const common = { size: 'sm' as const, flex: '1', minW: '32' };

  if (f.op === 'empty') {
    return (
      <NativeSelect.Root {...common}>
        <NativeSelect.Field aria-label="Value" value={f.value || 'true'} onChange={(e) => onChange(e.currentTarget.value)}>
          <option value="true">Yes</option>
          <option value="false">No (has a value)</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    );
  }
  if (type === 'BOOLEAN') {
    return (
      <NativeSelect.Root {...common}>
        <NativeSelect.Field aria-label="Value" value={f.value} onChange={(e) => onChange(e.currentTarget.value)}>
          <option value="">Choose…</option>
          <option value="true">Checked</option>
          <option value="false">Unchecked</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    );
  }
  if ((type === 'SELECT' || type === 'MULTI_SELECT') && f.op !== 'in') {
    return (
      <NativeSelect.Root {...common}>
        <NativeSelect.Field aria-label="Value" value={f.value} onChange={(e) => onChange(e.currentTarget.value)}>
          <option value="">Choose…</option>
          {column?.options.choices?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    );
  }
  return (
    <Input
      {...common}
      aria-label="Value"
      value={f.value}
      onChange={(e) => onChange(e.target.value)}
      type={type === 'DATE' || type === 'TIMESTAMP' ? 'date' : type === 'NUMBER' && f.op !== 'in' ? 'number' : 'text'}
      placeholder={
        f.op === 'in'
          ? column?.options.choices
            ? `e.g. ${column.options.choices.slice(0, 2).join(', ')}`
            : 'Comma-separated values'
          : 'Value'
      }
    />
  );
}
