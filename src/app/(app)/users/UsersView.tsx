'use client';

import {
  Avatar,
  Box,
  Button,
  CloseButton,
  Dialog,
  Field,
  HStack,
  IconButton,
  Input,
  Portal,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react';
import { Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { PaginationBar } from '@/components/PaginationBar';
import { SearchInput } from '@/components/SearchInput';
import { toastError, toaster } from '@/components/ui/toaster';
import { useAuth } from '@/context/AuthContext';
import { api, ApiError, withQuery } from '@/lib/api';
import { formatDateTime, timeAgo } from '@/lib/format';
import type { AuthConfig, Paginated, User } from '@/lib/types';
import { useUrlState } from '@/lib/useUrlState';

export function UsersView() {
  const { user: me } = useAuth();
  const { get, set, page } = useUrlState();
  const q = get('q');
  const pageSize = Number(get('pageSize')) || 50;
  const { data, mutate } = useSWR<Paginated<User>>(withQuery('/api/users', { page, pageSize, q }));
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<User | null>(null);

  return (
    <Box maxW="5xl">
      <PageHeader
        title="People"
        description="Everyone here can sign in with Google, edit tables, manage API tokens and invite others."
        actions={
          <Button size="sm" colorPalette="ledger" onClick={() => setInviting(true)}>
            <UserPlus /> Invite someone
          </Button>
        }
      />
      <HStack mb="4">
        <SearchInput value={q} onChange={(v) => set({ q: v })} placeholder="Search by name or email" />
      </HStack>

      <Table.ScrollArea borderWidth="1px" borderColor="rule" rounded="lg" bg="surface">
        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="canvas">
              <Table.ColumnHeader>Person</Table.ColumnHeader>
              <Table.ColumnHeader>Invited by</Table.ColumnHeader>
              <Table.ColumnHeader>Last sign-in</Table.ColumnHeader>
              <Table.ColumnHeader w="12" />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data?.items.map((u) => (
              <Table.Row key={u.id}>
                <Table.Cell>
                  <HStack gap="3">
                    <Avatar.Root size="sm">
                      <Avatar.Fallback name={u.name ?? u.email} />
                      {u.avatarUrl && <Avatar.Image src={u.avatarUrl} />}
                    </Avatar.Root>
                    <Box minW="0">
                      <Text fontWeight="500" truncate>
                        {u.name ?? u.email.split('@')[0]}
                        {u.id === me?.id && (
                          <Text as="span" color="inkMuted" fontWeight="400">
                            {' '}
                            (you)
                          </Text>
                        )}
                      </Text>
                      <Text textStyle="sm" color="inkMuted" truncate>
                        {u.email}
                      </Text>
                    </Box>
                  </HStack>
                </Table.Cell>
                <Table.Cell color="inkMuted">{u.invitedBy?.email ?? 'Initial user'}</Table.Cell>
                <Table.Cell color="inkMuted" title={formatDateTime(u.lastLoginAt)}>
                  {u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Hasn’t signed in yet'}
                </Table.Cell>
                <Table.Cell>
                  {u.id !== me?.id && (
                    <IconButton
                      aria-label={`Remove ${u.email}`}
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => setRemoving(u)}
                    >
                      <Trash2 />
                    </IconButton>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
      <PaginationBar
        meta={data?.meta}
        noun="people"
        onPageChange={(p) => set({ page: p })}
        onPageSizeChange={(s) => set({ pageSize: s })}
      />

      <InviteDialog open={inviting} onOpenChange={setInviting} onInvited={() => mutate()} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.email}?`}
        description="They’re signed out immediately and can’t sign in again unless someone re-invites them. Tables and tokens they created stay."
        confirmLabel="Remove access"
        onConfirm={async () => {
          try {
            await api(`/api/users/${removing!.id}`, { method: 'DELETE' });
            toaster.create({ type: 'success', title: `Removed ${removing!.email}` });
            await mutate();
          } catch (err) {
            toastError(err, 'Could not remove access');
          }
        }}
      />
    </Box>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: () => void;
}) {
  const { data: config } = useSWR<AuthConfig>('/api/auth/config');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const domains = config?.allowedDomains.map((d) => `@${d}`).join(', ');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/api/users/invite', { method: 'POST', body: { email } });
      toaster.create({
        type: 'success',
        title: `Invited ${email}`,
        description: 'They can now sign in with Google. Let them know; no email is sent.',
      });
      setEmail('');
      onInvited();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not invite');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)} size="sm" lazyMount unmountOnExit>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <form onSubmit={submit}>
              <Dialog.Header>
                <Dialog.Title>Invite someone</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap="3">
                  <Field.Root required invalid={!!error}>
                    <Field.Label>Company email</Field.Label>
                    <Input
                      autoFocus
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={config ? `name@${config.allowedDomains[0]}` : ''}
                    />
                    {error ? (
                      <Field.ErrorText>{error}</Field.ErrorText>
                    ) : (
                      domains && <Field.HelperText>Only {domains} addresses can be invited.</Field.HelperText>
                    )}
                  </Field.Root>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button type="submit" colorPalette="ledger" loading={busy}>
                  Send invite
                </Button>
              </Dialog.Footer>
            </form>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
