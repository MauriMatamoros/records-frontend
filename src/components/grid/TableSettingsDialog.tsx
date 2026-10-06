'use client';

import {
  Alert,
  Button,
  CloseButton,
  Dialog,
  Field,
  HStack,
  Input,
  Portal,
  Stack,
  Textarea,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTable } from '@/context/TableContext';
import { api, ApiError } from '@/lib/api';
import { pluralize } from '@/lib/format';
import { ConfirmDialog } from '../ConfirmDialog';
import { toaster } from '../ui/toaster';

export function TableSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)} lazyMount unmountOnExit>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <SettingsForm onDone={() => onOpenChange(false)} />
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function SettingsForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const { table, rows, mutateTable } = useTable();
  const [name, setName] = useState(table?.name ?? '');
  const [description, setDescription] = useState(table?.description ?? '');
  const [slug, setSlug] = useState(table?.slug ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!table) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await mutateTable(
        api(`/api/tables/${table!.id}`, {
          method: 'PATCH',
          body: { name, description, slug: slug !== table!.slug ? slug : undefined },
        }),
        { revalidate: false },
      );
      toaster.create({ type: 'success', title: 'Table saved' });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save');
      setBusy(false);
    }
  }

  async function remove() {
    await api(`/api/tables/${table!.id}`, { method: 'DELETE' });
    toaster.create({ type: 'success', title: `Deleted ${table!.name}` });
    router.replace('/tables');
  }

  return (
    <form onSubmit={save}>
      <Dialog.Header>
        <Dialog.Title>Table settings</Dialog.Title>
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
            <Field.Label>Name</Field.Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </Field.Root>
          <Field.Root>
            <Field.Label>Description</Field.Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} />
          </Field.Root>
          <Field.Root invalid={!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)}>
            <Field.Label>API slug</Field.Label>
            <Input fontFamily="mono" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} maxLength={64} />
            <Field.HelperText>
              Used in API URLs like /api/v1/tables/{slug || '…'}. Changing it breaks services that use the old one.
            </Field.HelperText>
            <Field.ErrorText>Use lowercase letters and numbers separated by single hyphens.</Field.ErrorText>
          </Field.Root>
        </Stack>
      </Dialog.Body>
      <Dialog.Footer justifyContent="space-between">
        <Button type="button" variant="ghost" colorPalette="red" onClick={() => setConfirmDelete(true)}>
          Delete table
        </Button>
        <HStack>
          <Dialog.ActionTrigger asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Dialog.ActionTrigger>
          <Button type="submit" colorPalette="ledger" loading={busy} disabled={!name.trim()}>
            Save
          </Button>
        </HStack>
      </Dialog.Footer>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${table.name}?`}
        description={`This permanently deletes the table and ${rows ? pluralize(rows.meta.total, 'record') : 'all its records'}. Services reading /api/v1/tables/${table.slug} will get 404s.`}
        confirmLabel="Delete table"
        onConfirm={remove}
      />
    </form>
  );
}
