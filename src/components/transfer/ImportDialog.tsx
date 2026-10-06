'use client';

import {
  Button,
  CloseButton,
  Dialog,
  Field,
  HStack,
  Link,
  Portal,
  RadioGroup,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useTable } from '@/context/TableContext';
import { api, ApiError } from '@/lib/api';
import type { ImportResult } from '@/lib/types';
import { toaster } from '../ui/toaster';
import { FilePicker } from './FilePicker';
import { ImportReport } from './ImportReport';
import { useDryRun } from './useDryRun';

type Mode = 'append' | 'upsert';

export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)} size="lg" scrollBehavior="inside" lazyMount unmountOnExit>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <ImportForm onDone={() => onOpenChange(false)} />
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function ImportForm({ onDone }: { onDone: () => void }) {
  const { table, refresh } = useTable();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>('append');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const pk = table?.columns.find((c) => c.primary);
  const url = table ? `/api/tables/${table.id}/import` : null;
  const dryRun = useDryRun<ImportResult>(url, file, { mode });
  const preview = dryRun.data ?? null;
  const checking = dryRun.isLoading;
  const readError =
    dryRun.error instanceof ApiError ? dryRun.error.message : dryRun.error ? 'Could not read the file' : null;

  const send = (skipInvalid: boolean) => {
    const fd = new FormData();
    fd.append('file', file!);
    fd.append('mode', mode);
    if (skipInvalid) fd.append('skipInvalid', 'true');
    return api<ImportResult>(url!, { method: 'POST', body: fd });
  };

  async function commit(skipInvalid: boolean) {
    setImporting(true);
    try {
      const result = await send(skipInvalid);
      if (!result.committed) {
        await dryRun.mutate(result, { revalidate: false });
        setImporting(false);
        return;
      }
      const parts = [
        result.created && `${result.created.toLocaleString()} added`,
        result.updated && `${result.updated.toLocaleString()} updated`,
        result.invalid && `${result.invalid.toLocaleString()} skipped`,
      ].filter(Boolean);
      toaster.create({ type: 'success', title: 'Import finished', description: parts.join(', ') });
      refresh();
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed');
      setImporting(false);
    }
  }

  const writable = preview ? preview.created + preview.updated : 0;
  const templateHref = (format: string) => `/api/tables/${table?.id}/import-template?format=${format}`;

  return (
    <>
      <Dialog.Header>
        <Dialog.Title>Import into {table?.name}</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <Stack gap="5">
          <Text color="inkMuted" textStyle="sm">
            Headers are matched to columns by name. Need a starting point? Download a template as{' '}
            <Link href={templateHref('xlsx')} color="ledger.fg">
              Excel
            </Link>{' '}
            or{' '}
            <Link href={templateHref('csv')} color="ledger.fg">
              CSV
            </Link>
            .
          </Text>

          <FilePicker onFile={setFile} />

          <Field.Root>
            <Field.Label>When a record already exists</Field.Label>
            <RadioGroup.Root
              value={mode}
              onValueChange={(e) => setMode(e.value as Mode)}
              colorPalette="ledger"
              size="sm"
            >
              <Stack gap="2">
                <RadioGroup.Item value="append">
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                  <RadioGroup.ItemText>
                    Add every row as a new record
                    {pk && (
                      <Text as="span" color="inkMuted">
                        {' '}
                        (rows whose {pk.name} already exists are rejected)
                      </Text>
                    )}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
                <RadioGroup.Item value="upsert" disabled={!pk}>
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                  <RadioGroup.ItemText>
                    {pk ? `Update records with a matching ${pk.name}, add the rest` : 'Update matching records (needs a primary key column)'}
                    {pk && (
                      <Text as="span" color="inkMuted">
                        {' '}
                        (blank cells keep the current value)
                      </Text>
                    )}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
              </Stack>
            </RadioGroup.Root>
          </Field.Root>

          {(error ?? readError) && (
            <Text color="danger" textStyle="sm">
              {error ?? readError}
            </Text>
          )}
          {checking && (
            <HStack color="inkMuted">
              <Spinner size="sm" /> <Text textStyle="sm">Checking every row…</Text>
            </HStack>
          )}
          {preview && !checking && <ImportReport result={preview} />}
        </Stack>
      </Dialog.Body>
      <Dialog.Footer>
        <Dialog.ActionTrigger asChild>
          <Button variant="outline">Cancel</Button>
        </Dialog.ActionTrigger>
        {preview && preview.invalid > 0 && writable > 0 && (
          <Button variant="outline" colorPalette="ledger" loading={importing} onClick={() => commit(true)}>
            Import {writable.toLocaleString()} valid rows only
          </Button>
        )}
        <Button
          colorPalette="ledger"
          loading={importing}
          disabled={!preview || checking || preview.invalid > 0 || writable === 0}
          onClick={() => commit(false)}
        >
          {preview && writable > 0 ? `Import ${writable.toLocaleString()} records` : 'Import'}
        </Button>
      </Dialog.Footer>
    </>
  );
}
