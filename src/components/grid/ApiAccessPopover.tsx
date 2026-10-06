'use client';

import { Box, Button, Clipboard, Code, IconButton, Link, Popover, Portal, Stack, Text } from '@chakra-ui/react';
import { Braces } from 'lucide-react';
import NextLink from 'next/link';
import { useSyncExternalStore } from 'react';
import { useTable } from '@/context/TableContext';

const noopSubscribe = () => () => {};

/** Shows how internal services read this table, using the current view's filters. */
export function ApiAccessPopover() {
  const { table, viewParams } = useTable();
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => '',
  );
  if (!table) return null;

  const params = new URLSearchParams(viewParams);
  params.delete('page');
  const query = decodeURIComponent(params.toString());
  const url = `${origin}/api/v1/tables/${table.slug}/rows${query ? `?${query}` : ''}`;
  const curl = `curl -H "Authorization: Bearer $RECORDS_TOKEN" \\\n  '${url}'`;

  return (
    <Popover.Root positioning={{ placement: 'bottom-end' }} lazyMount>
      <Popover.Trigger asChild>
        <Button size="sm" variant="outline">
          <Braces /> API
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content w={{ base: 'calc(100vw - 32px)', md: 'lg' }}>
            <Popover.Body>
              <Stack gap="3">
                <Text fontWeight="600">Read this table from another service</Text>
                <Text textStyle="sm" color="inkMuted">
                  Send an API token as a bearer header. This request returns the records in your current view, 50 per page.
                </Text>
                <Box position="relative">
                  <Code display="block" whiteSpace="pre-wrap" wordBreak="break-all" p="3" pr="10" fontSize="xs" bg="canvas">
                    {curl}
                  </Code>
                  <Clipboard.Root value={curl.replace('\\\n  ', '')} position="absolute" top="1.5" right="1.5">
                    <Clipboard.Trigger asChild>
                      <IconButton aria-label="Copy command" size="2xs" variant="ghost">
                        <Clipboard.Indicator />
                      </IconButton>
                    </Clipboard.Trigger>
                  </Clipboard.Root>
                </Box>
                <Text textStyle="sm" color="inkMuted">
                  Look up one record by primary key with{' '}
                  <Code fontSize="xs">/rows/by-key/{'{value}'}</Code>, or download with{' '}
                  <Code fontSize="xs">/export?format=csv</Code>.
                </Text>
                <Stack direction="row" gap="4">
                  <Link asChild color="ledger.fg" textStyle="sm">
                    <NextLink href="/tokens">Create a token</NextLink>
                  </Link>
                  <Link href="/api/v1/docs" target="_blank" color="ledger.fg" textStyle="sm">
                    API reference
                  </Link>
                </Stack>
              </Stack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
