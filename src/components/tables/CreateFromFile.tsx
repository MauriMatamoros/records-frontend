'use client';

import {
  Badge,
  Button,
  Field,
  HStack,
  Input,
  NativeSelect,
  Spinner,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { columnTypeInfo, KEYABLE } from '@/lib/columnTypes';
import type { CreateFromFileResult } from '@/lib/types';
import { FilePicker } from '../transfer/FilePicker';
import { useDryRun } from '../transfer/useDryRun';
import { ImportReport } from '../transfer/ImportReport';
import { toaster } from '../ui/toaster';

function formData(file: File, fields: Record<string, string | undefined>) {
  const fd = new FormData();
  fd.append('file', file);
  for (const [k, v] of Object.entries(fields)) if (v) fd.append(k, v);
  return fd;
}

export function CreateFromFile({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [primaryKey, setPrimaryKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const dryRun = useDryRun<CreateFromFileResult>('/api/tables/import', file, {
    primaryKey: primaryKey || undefined,
  });
  const preview = dryRun.data ?? null;
  const checking = dryRun.isLoading;
  const readError =
    dryRun.error instanceof ApiError ? dryRun.error.message : dryRun.error ? 'Could not read the file' : null;

  async function create() {
    if (!file) return;
    setCreating(true);
    try {
      const result = await api<CreateFromFileResult>('/api/tables/import', {
        method: 'POST',
        body: formData(file, {
          name: name.trim() || undefined,
          primaryKey: primaryKey || undefined,
        }),
      });
      toaster.create({
        type: 'success',
        title: `Created ${result.table!.name}`,
        description: `Imported ${result.created.toLocaleString()} records.`,
      });
      onDone();
      router.push(`/tables/${result.table!.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the table');
      setCreating(false);
    }
  }

  const columns = preview?.table?.columns ?? [];

  return (
    <Stack gap="4">
      <FilePicker
        onFile={(f) => {
          setFile(f);
          setPrimaryKey('');
          if (f && !name) setName(f.name.replace(/\.[^.]+$/, ''));
        }}
      />

      {(error ?? readError) && (
        <Text color="danger" textStyle="sm">
          {error ?? readError}
        </Text>
      )}

      {checking && !preview && (
        <HStack color="inkMuted">
          <Spinner size="sm" /> <Text textStyle="sm">Reading file…</Text>
        </HStack>
      )}

      {preview && (
        <>
          <HStack gap="4" align="flex-start" wrap="wrap">
            <Field.Root flex="1" minW="48">
              <Field.Label>Table name</Field.Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </Field.Root>
            <Field.Root flex="1" minW="48">
              <Field.Label>Primary key</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field value={primaryKey} onChange={(e) => setPrimaryKey(e.currentTarget.value)}>
                  <option value="">None</option>
                  {columns
                    .filter((c) => KEYABLE.has(c.type) || c.primary)
                    .map((c) => (
                      <option key={c.key} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
              <Field.HelperText>Values must be filled in and unique.</Field.HelperText>
            </Field.Root>
          </HStack>

          <Stack gap="1.5">
            <Text textStyle="sm" fontWeight="600">
              Detected columns
            </Text>
            <Table.ScrollArea borderWidth="1px" borderColor="rule" rounded="md" maxH="56">
              <Table.Root size="sm">
                <Table.Body>
                  {columns.map((c) => {
                    const info = columnTypeInfo(c.type);
                    return (
                      <Table.Row key={c.key}>
                        <Table.Cell fontWeight="500">{c.name}</Table.Cell>
                        <Table.Cell color="inkMuted">
                          <HStack gap="1.5">
                            <info.icon size={14} aria-hidden /> {info.label}
                            {c.options.choices && (
                              <Text as="span" textStyle="xs">
                                ({c.options.choices.length} options)
                              </Text>
                            )}
                          </HStack>
                        </Table.Cell>
                        <Table.Cell textAlign="end">
                          {c.primary && (
                            <Badge colorPalette="ledger" size="sm">
                              Primary key
                            </Badge>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            </Table.ScrollArea>
            <Text textStyle="xs" color="inkMuted">
              Types are guessed from the values. You can change them after the table is created.
            </Text>
          </Stack>

          <ImportReport result={preview} />

          <Button
            colorPalette="ledger"
            alignSelf="flex-end"
            loading={creating}
            disabled={checking || preview.invalid > 0 || !name.trim()}
            onClick={create}
          >
            Create table with {preview.created.toLocaleString()} records
          </Button>
        </>
      )}
    </Stack>
  );
}
