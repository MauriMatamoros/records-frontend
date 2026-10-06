'use client';

import {
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Field,
  Input,
  Portal,
  Stack,
  Tabs,
  Textarea,
} from '@chakra-ui/react';
import { FilePlus2, FileSpreadsheet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Table } from '@/lib/types';
import { toaster } from '../ui/toaster';
import { CreateFromFile } from './CreateFromFile';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTableDialog({ open, onOpenChange }: Props) {
  const [tab, setTab] = useState('blank');

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      size={tab === 'file' ? 'lg' : 'md'}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>New table</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)} variant="line">
                <Tabs.List mb="4">
                  <Tabs.Trigger value="blank">
                    <FilePlus2 size={15} /> Start blank
                  </Tabs.Trigger>
                  <Tabs.Trigger value="file">
                    <FileSpreadsheet size={15} /> From a spreadsheet
                  </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="blank">
                  <BlankTableForm onDone={() => onOpenChange(false)} />
                </Tabs.Content>
                <Tabs.Content value="file">
                  <CreateFromFile onDone={() => onOpenChange(false)} />
                </Tabs.Content>
              </Tabs.Root>
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function BlankTableForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [keyName, setKeyName] = useState('Name');
  const [keyIsPrimary, setKeyIsPrimary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const table = await api<Table>('/api/tables', {
        method: 'POST',
        body: {
          name,
          description: description || undefined,
          columns: [
            { name: keyName, type: 'TEXT', primary: keyIsPrimary || undefined },
          ],
        },
      });
      toaster.create({ type: 'success', title: `Created ${table.name}` });
      onDone();
      router.push(`/tables/${table.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the table');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="4">
        <Field.Root required invalid={!!error}>
          <Field.Label>
            Table name <Field.RequiredIndicator />
          </Field.Label>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Client accounts" maxLength={100} />
          {error && <Field.ErrorText>{error}</Field.ErrorText>}
        </Field.Root>
        <Field.Root>
          <Field.Label>Description</Field.Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this table holds and who maintains it"
            maxLength={500}
            rows={2}
          />
        </Field.Root>
        <Field.Root required>
          <Field.Label>
            First column <Field.RequiredIndicator />
          </Field.Label>
          <Input value={keyName} onChange={(e) => setKeyName(e.target.value)} maxLength={100} />
          <Checkbox.Root
            mt="2"
            size="sm"
            checked={keyIsPrimary}
            onCheckedChange={(e) => setKeyIsPrimary(!!e.checked)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Use as primary key (required and unique)</Checkbox.Label>
          </Checkbox.Root>
          <Field.HelperText>You can add more columns after the table is created.</Field.HelperText>
        </Field.Root>
        <Button type="submit" colorPalette="ledger" loading={busy} alignSelf="flex-end">
          Create table
        </Button>
      </Stack>
    </form>
  );
}
