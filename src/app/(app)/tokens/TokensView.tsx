'use client';

import {
  Alert,
  Badge,
  Box,
  Button,
  Clipboard,
  CloseButton,
  Code,
  Dialog,
  Field,
  HStack,
  IconButton,
  Input,
  Portal,
  Stack,
  Switch,
  Table,
  Text,
} from '@chakra-ui/react';
import { KeyRound, Plus } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { PaginationBar } from '@/components/PaginationBar';
import { toastError, toaster } from '@/components/ui/toaster';
import { api, ApiError, withQuery } from '@/lib/api';
import { formatDateTime, timeAgo } from '@/lib/format';
import type { ApiToken, CreatedApiToken, Paginated } from '@/lib/types';
import { useUrlState } from '@/lib/useUrlState';

export function TokensView() {
  const { get, set, page } = useUrlState();
  const includeRevoked = get('revoked') === '1';
  const pageSize = Number(get('pageSize')) || 25;
  const { data, mutate } = useSWR<Paginated<ApiToken>>(
    withQuery('/api/tokens', { page, pageSize, includeRevoked }),
  );
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiToken | null>(null);

  return (
    <Box maxW="5xl">
      <PageHeader
        title="API tokens"
        description="Tokens give internal services read-only access to every table through /api/v1. Each request is recorded in the activity log under the token’s name."
        actions={
          <Button size="sm" colorPalette="ledger" onClick={() => setCreating(true)}>
            <Plus /> New token
          </Button>
        }
      />
      <HStack mb="4" justify="space-between" wrap="wrap" gap="3">
        <Switch.Root
          size="sm"
          colorPalette="ledger"
          checked={includeRevoked}
          onCheckedChange={(e) => set({ revoked: e.checked ? '1' : undefined })}
        >
          <Switch.HiddenInput />
          <Switch.Control />
          <Switch.Label>Show revoked tokens</Switch.Label>
        </Switch.Root>
        <Button asChild size="xs" variant="ghost">
          <a href="/api/v1/docs" target="_blank" rel="noreferrer">
            Open the API reference
          </a>
        </Button>
      </HStack>

      <Table.ScrollArea borderWidth="1px" borderColor="rule" rounded="lg" bg="surface">
        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="canvas">
              <Table.ColumnHeader>Service</Table.ColumnHeader>
              <Table.ColumnHeader>Token</Table.ColumnHeader>
              <Table.ColumnHeader>Created</Table.ColumnHeader>
              <Table.ColumnHeader>Last used</Table.ColumnHeader>
              <Table.ColumnHeader w="24" />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.items.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={5} py="10" textAlign="center" color="inkMuted">
                  No tokens yet. Create one for each service that needs to read records.
                </Table.Cell>
              </Table.Row>
            )}
            {data?.items.map((t) => (
              <Table.Row key={t.id} opacity={t.revokedAt ? 0.6 : 1}>
                <Table.Cell fontWeight="500">
                  {t.name}
                  {t.revokedAt && (
                    <Badge ms="2" colorPalette="red" variant="subtle" size="sm">
                      Revoked
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell fontFamily="mono" fontSize="xs" color="inkMuted">
                  {t.prefix}…
                </Table.Cell>
                <Table.Cell color="inkMuted" title={formatDateTime(t.createdAt)}>
                  {timeAgo(t.createdAt)}
                  {t.createdBy && (
                    <Text textStyle="xs">by {t.createdBy.email}</Text>
                  )}
                </Table.Cell>
                <Table.Cell color="inkMuted" title={formatDateTime(t.lastUsedAt)}>
                  {timeAgo(t.lastUsedAt)}
                </Table.Cell>
                <Table.Cell textAlign="end">
                  {!t.revokedAt && (
                    <Button size="xs" variant="ghost" colorPalette="red" onClick={() => setRevoking(t)}>
                      Revoke
                    </Button>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
      <PaginationBar
        meta={data?.meta}
        noun="tokens"
        onPageChange={(p) => set({ page: p })}
        onPageSizeChange={(s) => set({ pageSize: s })}
      />

      <CreateTokenDialog open={creating} onOpenChange={setCreating} onCreated={() => mutate()} />
      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(open) => !open && setRevoking(null)}
        title={`Revoke ${revoking?.name}?`}
        description="Requests using this token start failing immediately. This can’t be undone; create a new token if the service still needs access."
        confirmLabel="Revoke token"
        onConfirm={async () => {
          try {
            await api(`/api/tokens/${revoking!.id}`, { method: 'DELETE' });
            toaster.create({ type: 'success', title: `Revoked ${revoking!.name}` });
            await mutate();
          } catch (err) {
            toastError(err, 'Could not revoke the token');
          }
        }}
      />
    </Box>
  );
}

function CreateTokenDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [created, setCreated] = useState<CreatedApiToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setCreated(await api<CreatedApiToken>('/api/tokens', { method: 'POST', body: { name } }));
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the token');
    } finally {
      setBusy(false);
    }
  }

  const close = () => {
    onOpenChange(false);
    setName('');
    setCreated(null);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => !e.open && close()}
      closeOnInteractOutside={!created}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {created ? (
              <>
                <Dialog.Header>
                  <Dialog.Title>Token for {created.name}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap="4">
                    <Alert.Root status="warning" size="sm">
                      <Alert.Indicator />
                      <Alert.Description>
                        Copy it now and store it in the service’s secrets. You won’t be able to see it again.
                      </Alert.Description>
                    </Alert.Root>
                    <HStack bg="canvas" borderWidth="1px" borderColor="rule" rounded="md" p="2" pl="3">
                      <Code flex="1" bg="transparent" fontSize="sm" wordBreak="break-all">
                        {created.token}
                      </Code>
                      <Clipboard.Root value={created.token}>
                        <Clipboard.Trigger asChild>
                          <IconButton aria-label="Copy token" size="sm" variant="outline">
                            <Clipboard.Indicator />
                          </IconButton>
                        </Clipboard.Trigger>
                      </Clipboard.Root>
                    </HStack>
                    <Text textStyle="sm" color="inkMuted">
                      Send it as <Code fontSize="xs">Authorization: Bearer {'<token>'}</Code> to any{' '}
                      <Code fontSize="xs">/api/v1</Code> endpoint.
                    </Text>
                  </Stack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button colorPalette="ledger" onClick={close}>
                    I’ve copied it
                  </Button>
                </Dialog.Footer>
              </>
            ) : (
              <form onSubmit={submit}>
                <Dialog.Header>
                  <Dialog.Title>New API token</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Field.Root required invalid={!!error}>
                    <Field.Label>Service name</Field.Label>
                    <Input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="billing-service"
                      maxLength={80}
                    />
                    {error ? (
                      <Field.ErrorText>{error}</Field.ErrorText>
                    ) : (
                      <Field.HelperText>Name it after the service that will use it, so its reads are easy to find in the activity log.</Field.HelperText>
                    )}
                  </Field.Root>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button type="button" variant="outline" onClick={close}>
                    Cancel
                  </Button>
                  <Button type="submit" colorPalette="ledger" loading={busy} disabled={!name.trim()}>
                    <KeyRound /> Create token
                  </Button>
                </Dialog.Footer>
              </form>
            )}
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
