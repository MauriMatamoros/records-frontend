'use client';

import {
  Alert,
  Button,
  Checkbox,
  CheckboxGroup,
  CloseButton,
  Dialog,
  Field,
  Flex,
  Input,
  NativeSelect,
  Portal,
  Stack,
  Text,
  Textarea,
  Wrap,
} from '@chakra-ui/react';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useTable } from '@/context/TableContext';
import { api, ApiError } from '@/lib/api';
import { columnTypeInfo } from '@/lib/columnTypes';
import { formatDateTime } from '@/lib/format';
import type { Column, Row, RowData } from '@/lib/types';
import { toaster } from '../ui/toaster';
import { fromInput } from './CellEditor';

interface Props {
  /** `null` creates a new record. */
  row: Row | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Draft = Record<string, string | boolean | string[]>;

function toDraft(columns: Column[], data: RowData): Draft {
  return Object.fromEntries(
    columns.map((c) => {
      const v = data[c.key];
      if (c.type === 'BOOLEAN') return [c.key, v === true];
      if (c.type === 'MULTI_SELECT') return [c.key, Array.isArray(v) ? (v as string[]) : []];
      return [c.key, v === undefined || v === null ? '' : String(v)];
    }),
  );
}

function fromDraft(column: Column, value: Draft[string]): unknown {
  if (column.type === 'BOOLEAN') return value;
  if (column.type === 'MULTI_SELECT') return (value as string[]).length ? value : null;
  return fromInput(column, value as string);
}

export function RecordDialog({ row, open, onOpenChange }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)} size="lg" scrollBehavior="inside" lazyMount unmountOnExit>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <RecordForm row={row} onDone={() => onOpenChange(false)} />
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function RecordForm({ row, onDone }: { row: Row | null; onDone: () => void }) {
  const { table, refresh } = useTable();
  const columns = table?.columns ?? [];
  const [initial] = useState(() => toDraft(columns, row?.data ?? {}));
  const [draft, setDraft] = useState<Draft>(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: string, value: Draft[string]) => setDraft((d) => ({ ...d, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!table) return;
    const data: RowData = {};
    for (const c of columns) {
      if (row && JSON.stringify(draft[c.key]) === JSON.stringify(initial[c.key])) continue;
      const v = fromDraft(c, draft[c.key]);
      if (row || v !== null) data[c.key] = v;
    }
    if (row && Object.keys(data).length === 0) return onDone();

    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      await api(row ? `/api/tables/${table.id}/rows/${row.id}` : `/api/tables/${table.id}/rows`, {
        method: row ? 'PATCH' : 'POST',
        body: { data },
      });
      toaster.create({ type: 'success', title: row ? 'Record saved' : 'Record added' });
      refresh();
      onDone();
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) {
        setFieldErrors(err.fields);
        setError(err.status === 409 ? 'Another record already uses one of these values.' : 'Check the highlighted fields.');
      } else {
        setError(err instanceof Error ? err.message : 'Could not save the record');
      }
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <Dialog.Header>
        <Dialog.Title>
          {row
            ? String(table?.primaryKey ? (row.data[table.primaryKey] ?? 'Record') : 'Record')
            : `New record in ${table?.name ?? ''}`}
        </Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <Stack gap="4">
          {error && (
            <Alert.Root status="error" size="sm">
              <Alert.Indicator />
              <Alert.Description>{error}</Alert.Description>
            </Alert.Root>
          )}
          {columns.length === 0 && <Text color="inkMuted">This table has no columns yet. Add one first.</Text>}
          {columns.map((c) => (
            <ColumnField
              key={c.id}
              column={c}
              value={draft[c.key]}
              error={fieldErrors[c.key]}
              onChange={(v) => set(c.key, v)}
            />
          ))}
          {row && (
            <Text textStyle="xs" color="inkMuted">
              Added {formatDateTime(row.createdAt)}. Last changed {formatDateTime(row.updatedAt)}.
            </Text>
          )}
        </Stack>
      </Dialog.Body>
      <Dialog.Footer>
        <Dialog.ActionTrigger asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Dialog.ActionTrigger>
        <Button type="submit" colorPalette="ledger" loading={busy} disabled={columns.length === 0}>
          {row ? 'Save record' : 'Add record'}
        </Button>
      </Dialog.Footer>
    </form>
  );
}

function ColumnField({
  column: c,
  value,
  error,
  onChange,
}: {
  column: Column;
  value: Draft[string];
  error?: string;
  onChange: (v: Draft[string]) => void;
}) {
  const info = columnTypeInfo(c.type);
  const label = (
    <Field.Label>
      <Flex align="center" gap="1.5">
        {c.primary ? <KeyRound size={13} aria-label="Primary key" /> : <info.icon size={13} aria-hidden />}
        {c.name}
        {c.required && <Field.RequiredIndicator />}
      </Flex>
    </Field.Label>
  );

  return (
    <Field.Root invalid={!!error} required={c.required}>
      {label}
      {c.type === 'BOOLEAN' ? (
        <Checkbox.Root colorPalette="ledger" checked={value as boolean} onCheckedChange={(e) => onChange(!!e.checked)}>
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Yes</Checkbox.Label>
        </Checkbox.Root>
      ) : c.type === 'SELECT' ? (
        <NativeSelect.Root>
          <NativeSelect.Field value={value as string} onChange={(e) => onChange(e.currentTarget.value)}>
            <option value="">—</option>
            {c.options.choices?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      ) : c.type === 'MULTI_SELECT' ? (
        <CheckboxGroup value={value as string[]} onValueChange={(v) => onChange(v)}>
          <Wrap gap="3">
            {c.options.choices?.map((o) => (
              <Checkbox.Root key={o} value={o} size="sm" colorPalette="ledger">
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>{o}</Checkbox.Label>
              </Checkbox.Root>
            ))}
          </Wrap>
        </CheckboxGroup>
      ) : c.type === 'LONG_TEXT' ? (
        <Textarea value={value as string} onChange={(e) => onChange(e.target.value)} rows={4} maxLength={50000} />
      ) : (
        <Input
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          type={{ NUMBER: 'number', DATE: 'date', EMAIL: 'email', URL: 'url' }[c.type as string] ?? 'text'}
          step={c.type === 'NUMBER' ? 'any' : undefined}
          maxLength={c.type === 'TEXT' ? 1000 : undefined}
        />
      )}
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  );
}
