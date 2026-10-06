'use client';

import {
  Badge,
  Box,
  Code,
  Field,
  Flex,
  IconButton,
  Input,
  NativeSelect,
  Table,
  Text,
} from '@chakra-ui/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Fragment, useState } from 'react';
import useSWR from 'swr';
import { PageHeader } from '@/components/PageHeader';
import { PaginationBar } from '@/components/PaginationBar';
import { SearchInput } from '@/components/SearchInput';
import { withQuery } from '@/lib/api';
import { formatDateTime, pluralize } from '@/lib/format';
import type { AuditLog, Paginated } from '@/lib/types';
import { useUrlState } from '@/lib/useUrlState';

const CATEGORIES = [
  { value: '', label: 'All activity' },
  { value: 'row.', label: 'Record changes' },
  { value: 'column.', label: 'Column changes' },
  { value: 'table.', label: 'Tables, imports and exports' },
  { value: 'api.read', label: 'API reads' },
  { value: 'token.', label: 'API tokens' },
  { value: 'user.', label: 'People' },
  { value: 'auth.', label: 'Sign-ins' },
];

type Detail = Record<string, unknown>;
const s = (v: unknown) => (v === undefined || v === null ? '' : String(v));

/** One-line, plain-language summary of an audit entry. */
function describe(log: AuditLog): string {
  const d = (log.detail ?? {}) as Detail;
  switch (log.action) {
    case 'auth.login':
      return `Signed in${d.provider === 'dev' ? ' (development)' : ''}`;
    case 'auth.login_rejected':
      return `Sign-in refused: ${s(d.reason).replace(/_/g, ' ')}`;
    case 'auth.logout':
      return 'Signed out';
    case 'user.invite':
      return `Invited ${s(d.email)}`;
    case 'user.remove':
      return `Removed ${s(d.email)}`;
    case 'user.bootstrap':
      return `Created the initial user ${s(d.email)}`;
    case 'table.create':
      return `Created table ${s(d.name)}`;
    case 'table.update':
      return `Changed table settings (${Object.keys((d.changes as Detail) ?? {}).join(', ') || 'no changes'})`;
    case 'table.delete':
      return `Deleted table ${s(d.name)} with ${pluralize(Number(d.rowCount ?? 0), 'record')}`;
    case 'table.import':
      return d.mode === 'create'
        ? `Created a table from ${s(d.file)} with ${pluralize(Number(d.created ?? 0), 'record')}`
        : `Imported ${s(d.file)}: ${s(d.created)} added, ${s(d.updated)} updated${d.skippedInvalid ? `, ${s(d.skippedInvalid)} skipped` : ''}`;
    case 'table.export':
      return `Exported ${pluralize(Number(d.rows ?? 0), 'record')} as ${s(d.format).toUpperCase()}`;
    case 'column.create':
      return `Added column ${s(d.key)}`;
    case 'column.update':
      return `Changed column ${s(d.key)}`;
    case 'column.delete':
      return `Deleted column ${s(d.name)}`;
    case 'column.reorder':
      return 'Reordered columns';
    case 'row.create':
      return 'Added a record';
    case 'row.update': {
      const keys = Object.keys((d.changes as Detail) ?? {});
      return keys.length ? `Changed ${keys.join(', ')}` : 'Saved a record without changes';
    }
    case 'row.delete':
      return 'Deleted a record';
    case 'token.create':
      return `Created token ${s(d.name)}`;
    case 'token.revoke':
      return `Revoked token ${s(d.name)}`;
    case 'token.rejected':
      return `Refused an API request (${s(d.reason)} token)`;
    case 'api.read':
      return `Read ${s(d.path)}${d.total !== undefined ? ` (${s(d.total)} matching)` : ''}`;
    default:
      return log.action;
  }
}

export function LogsView() {
  const { get, set, page } = useUrlState();
  const action = get('action');
  const actor = get('actor');
  const from = get('from');
  const to = get('to');
  const pageSize = Number(get('pageSize')) || 50;
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data } = useSWR<Paginated<AuditLog>>(
    withQuery('/api/audit', {
      page,
      pageSize,
      action,
      actor,
      from: from ? `${from}T00:00:00` : undefined,
      to: to ? `${to}T23:59:59.999` : undefined,
    }),
    { refreshInterval: 15_000 },
  );

  return (
    <Box maxW="6xl">
      <PageHeader
        title="Activity log"
        description="Every change, sign-in, import, export and API read, newest first."
      />

      <Flex gap="3" mb="4" wrap="wrap" align="flex-end">
        <Field.Root w="auto">
          <Field.Label textStyle="xs" color="inkMuted">
            Activity
          </Field.Label>
          <NativeSelect.Root size="sm" w="60">
            <NativeSelect.Field value={action} onChange={(e) => set({ action: e.currentTarget.value })} bg="surface">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root w="auto">
          <Field.Label textStyle="xs" color="inkMuted">
            Person or token
          </Field.Label>
          <SearchInput value={actor} onChange={(v) => set({ actor: v })} placeholder="Email or token name" maxW="56" />
        </Field.Root>
        <Field.Root w="auto">
          <Field.Label textStyle="xs" color="inkMuted">
            From
          </Field.Label>
          <Input size="sm" type="date" value={from} onChange={(e) => set({ from: e.target.value })} bg="surface" />
        </Field.Root>
        <Field.Root w="auto">
          <Field.Label textStyle="xs" color="inkMuted">
            To
          </Field.Label>
          <Input size="sm" type="date" value={to} onChange={(e) => set({ to: e.target.value })} bg="surface" />
        </Field.Root>
      </Flex>

      <Table.ScrollArea borderWidth="1px" borderColor="rule" rounded="lg" bg="surface">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row bg="canvas">
              <Table.ColumnHeader w="8" />
              <Table.ColumnHeader w="44">When</Table.ColumnHeader>
              <Table.ColumnHeader w="64">Who</Table.ColumnHeader>
              <Table.ColumnHeader>What</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.items.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={4} py="10" textAlign="center" color="inkMuted">
                  No activity matches these filters.
                </Table.Cell>
              </Table.Row>
            )}
            {data?.items.map((log) => {
              const open = expanded === log.id;
              return (
                <Fragment key={log.id}>
                  <Table.Row>
                    <Table.Cell px="1">
                      <IconButton
                        aria-label={open ? 'Hide details' : 'Show details'}
                        aria-expanded={open}
                        size="2xs"
                        variant="ghost"
                        onClick={() => setExpanded(open ? null : log.id)}
                      >
                        {open ? <ChevronDown /> : <ChevronRight />}
                      </IconButton>
                    </Table.Cell>
                    <Table.Cell color="inkMuted" whiteSpace="nowrap">
                      {formatDateTime(log.createdAt)}
                    </Table.Cell>
                    <Table.Cell>
                      <Text truncate>
                        {log.actorLabel ?? 'Unknown'}
                        {log.actorType !== 'USER' && (
                          <Badge ms="2" size="sm" variant="outline">
                            {log.actorType === 'API_TOKEN' ? 'API token' : 'System'}
                          </Badge>
                        )}
                      </Text>
                    </Table.Cell>
                    <Table.Cell color={log.action.endsWith('rejected') ? 'danger' : undefined}>
                      {describe(log)}
                    </Table.Cell>
                  </Table.Row>
                  {open && (
                    <Table.Row bg="canvas">
                      <Table.Cell />
                      <Table.Cell colSpan={3}>
                        <Text textStyle="xs" color="inkMuted" mb="1.5">
                          Action <Code fontSize="xs">{log.action}</Code>
                          {log.entityId && (
                            <>
                              {' '}on {log.entity} <Code fontSize="xs">{log.entityId}</Code>
                            </>
                          )}
                          {log.ip && <> from {log.ip}</>}
                          {log.requestId && (
                            <>
                              , request <Code fontSize="xs">{log.requestId}</Code>
                            </>
                          )}
                        </Text>
                        {log.detail !== null && (
                          <Code display="block" whiteSpace="pre-wrap" p="3" fontSize="xs" maxH="80" overflow="auto">
                            {JSON.stringify(log.detail, null, 2)}
                          </Code>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Fragment>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
      <PaginationBar
        meta={data?.meta}
        noun="entries"
        onPageChange={(p) => set({ page: p })}
        onPageSizeChange={(sz) => set({ pageSize: sz })}
      />
    </Box>
  );
}
