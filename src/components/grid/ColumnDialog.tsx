'use client';

import {
  Alert,
  Button,
  CloseButton,
  Dialog,
  Field,
  HStack,
  Input,
  NativeSelect,
  Portal,
  Stack,
  Switch,
  TagsInput,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useTable } from '@/context/TableContext';
import { api, ApiError } from '@/lib/api';
import { COLUMN_TYPES, KEYABLE } from '@/lib/columnTypes';
import type { Column, ColumnType } from '@/lib/types';
import { ConfirmDialog } from '../ConfirmDialog';
import { toaster } from '../ui/toaster';

interface Props {
  /** `null` creates a new column. */
  column: Column | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ColumnDialog({ column, open, onOpenChange }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)} lazyMount unmountOnExit>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <ColumnForm column={column} onDone={() => onOpenChange(false)} />
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function ColumnForm({ column, onDone }: { column: Column | null; onDone: () => void }) {
  const { table, refresh } = useTable();
  const [name, setName] = useState(column?.name ?? '');
  const [key, setKey] = useState('');
  const [type, setType] = useState<ColumnType>(column?.type ?? 'TEXT');
  const [choices, setChoices] = useState<string[]>(column?.options.choices ?? []);
  const [required, setRequired] = useState(column?.required ?? false);
  const [unique, setUnique] = useState(column?.unique ?? false);
  const [primary, setPrimary] = useState(column?.primary ?? false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const keyable = KEYABLE.has(type);
  const hasChoices = type === 'SELECT' || type === 'MULTI_SELECT';
  const currentPrimary = table?.columns.find((c) => c.primary && c.id !== column?.id);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!table) return;
    setBusy(true);
    setError(null);
    const body = {
      name,
      type,
      required: primary || required,
      unique: keyable ? primary || unique : false,
      primary: keyable ? primary : false,
      options: hasChoices ? { choices } : undefined,
      ...(column ? {} : { key: key || undefined }),
    };
    try {
      await api(column ? `/api/tables/${table.id}/columns/${column.id}` : `/api/tables/${table.id}/columns`, {
        method: column ? 'PATCH' : 'POST',
        body,
      });
      toaster.create({ type: 'success', title: column ? 'Column updated' : `Added ${name}` });
      refresh();
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the column');
      setBusy(false);
    }
  }

  async function remove() {
    await api(`/api/tables/${table!.id}/columns/${column!.id}`, { method: 'DELETE' });
    toaster.create({ type: 'success', title: `Deleted ${column!.name}` });
    refresh();
    onDone();
  }

  return (
    <form onSubmit={save}>
      <Dialog.Header>
        <Dialog.Title>{column ? `Edit ${column.name}` : 'Add column'}</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <Stack gap="4">
          {error && (
            <Alert.Root status="error" size="sm">
              <Alert.Indicator />
              <Alert.Description>{error}</Alert.Description>
            </Alert.Root>
          )}

          <Field.Root required>
            <Field.Label>
              Name <Field.RequiredIndicator />
            </Field.Label>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </Field.Root>

          {column ? (
            <Field.Root>
              <Field.Label>API key</Field.Label>
              <Text fontFamily="mono" fontSize="sm">
                {column.key}
              </Text>
              <Field.HelperText>The key consumers use in the API. It can’t be changed.</Field.HelperText>
            </Field.Root>
          ) : (
            <Field.Root>
              <Field.Label>API key</Field.Label>
              <Input
                fontFamily="mono"
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="Generated from the name"
                maxLength={64}
              />
              <Field.HelperText>Lowercase letters, numbers and underscores. Can’t be changed later.</Field.HelperText>
            </Field.Root>
          )}

          <Field.Root>
            <Field.Label>Type</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field value={type} onChange={(e) => setType(e.currentTarget.value as ColumnType)}>
                {COLUMN_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label} — {t.hint}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            {column && type !== column.type && (
              <Field.HelperText>Existing values aren’t converted; cells that no longer fit are flagged when edited.</Field.HelperText>
            )}
          </Field.Root>

          {hasChoices && (
            <Field.Root required>
              <TagsInput.Root
                value={choices}
                onValueChange={(d) => setChoices(d.value)}
                addOnPaste
                delimiter=","
                size="sm"
              >
                <TagsInput.Label>
                  Options <Field.RequiredIndicator />
                </TagsInput.Label>
                <TagsInput.Control>
                  <TagsInput.Items />
                  <TagsInput.Input placeholder="Type an option and press Enter" />
                </TagsInput.Control>
                <TagsInput.HiddenInput />
              </TagsInput.Root>
            </Field.Root>
          )}

          <Stack gap="3" pt="1">
            <ConstraintSwitch
              label="Primary key"
              help={
                !keyable
                  ? 'Only text, number, date, email and URL columns can be the primary key.'
                  : currentPrimary && primary && !column?.primary
                    ? `Replaces ${currentPrimary.name} as the primary key.`
                    : 'Identifies each record. Always required and unique; the API can look records up by it.'
              }
              checked={keyable && primary}
              disabled={!keyable}
              onChange={setPrimary}
            />
            <ConstraintSwitch
              label="Required"
              help="Every record must have a value."
              checked={primary || required}
              disabled={primary}
              onChange={setRequired}
            />
            <ConstraintSwitch
              label="Unique"
              help={keyable ? 'No two records can share a value.' : 'Not available for this type.'}
              checked={keyable && (primary || unique)}
              disabled={primary || !keyable}
              onChange={setUnique}
            />
          </Stack>
        </Stack>
      </Dialog.Body>
      <Dialog.Footer justifyContent="space-between">
        {column ? (
          <Button type="button" variant="ghost" colorPalette="red" onClick={() => setConfirmDelete(true)}>
            Delete column
          </Button>
        ) : (
          <span />
        )}
        <HStack>
          <Dialog.ActionTrigger asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Dialog.ActionTrigger>
          <Button type="submit" colorPalette="ledger" loading={busy} disabled={!name.trim() || (hasChoices && choices.length === 0)}>
            {column ? 'Save column' : 'Add column'}
          </Button>
        </HStack>
      </Dialog.Footer>

      {column && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete ${column.name}?`}
          description="This removes the column and its value from every record. API consumers reading this column will stop receiving it."
          confirmLabel="Delete column"
          onConfirm={remove}
        />
      )}
    </form>
  );
}

function ConstraintSwitch(props: {
  label: string;
  help: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Switch.Root
      colorPalette="ledger"
      checked={props.checked}
      disabled={props.disabled}
      onCheckedChange={(e) => props.onChange(e.checked)}
      alignItems="flex-start"
    >
      <Switch.HiddenInput />
      <Switch.Control mt="0.5" />
      <Switch.Label>
        <Text fontWeight="500">{props.label}</Text>
        <Text textStyle="xs" color="inkMuted" fontWeight="400">
          {props.help}
        </Text>
      </Switch.Label>
    </Switch.Root>
  );
}
