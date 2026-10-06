'use client';

import { Alert, Badge, Box, HStack, Stack, Table, Text, Wrap } from '@chakra-ui/react';
import { pluralize } from '@/lib/format';
import type { ImportResult } from '@/lib/types';

/** Summary of a dry run or completed import. */
export function ImportReport({ result }: { result: ImportResult }) {
  const headerFor = Object.fromEntries(result.mappedColumns.map((m) => [m.key, m.header]));
  const stats = [
    { label: result.committed ? 'Added' : 'Would add', value: result.created, always: true },
    { label: result.committed ? 'Updated' : 'Would update', value: result.updated },
    { label: 'Unchanged', value: result.unchanged },
    { label: 'With errors', value: result.invalid, danger: result.invalid > 0, always: true },
  ].filter((s) => s.value > 0 || s.always);

  return (
    <Stack gap="4">
      <HStack gap="6" wrap="wrap">
        {stats.map((s) => (
          <Box key={s.label}>
            <Text fontSize="2xl" fontWeight="700" lineHeight="1" color={s.danger ? 'danger' : 'ink'}>
              {s.value.toLocaleString()}
            </Text>
            <Text textStyle="sm" color="inkMuted">
              {s.label}
            </Text>
          </Box>
        ))}
        <Box>
          <Text fontSize="2xl" fontWeight="700" lineHeight="1" color="inkMuted">
            {result.totalRows.toLocaleString()}
          </Text>
          <Text textStyle="sm" color="inkMuted">
            Rows in file
          </Text>
        </Box>
      </HStack>

      <Box>
        <Text textStyle="sm" fontWeight="600" mb="1.5">
          Columns matched
        </Text>
        <Wrap gap="1.5">
          {result.mappedColumns.map((m) => (
            <Badge key={m.key} colorPalette="ledger" variant="subtle">
              {m.header}
            </Badge>
          ))}
          {result.ignoredHeaders.map((h) => (
            <Badge key={h} variant="outline" textDecoration="line-through" title="No matching column; ignored">
              {h}
            </Badge>
          ))}
        </Wrap>
        {result.ignoredHeaders.length > 0 && (
          <Text textStyle="xs" color="inkMuted" mt="1">
            Crossed-out headers don’t match any column and will be ignored.
          </Text>
        )}
      </Box>

      {result.errors.length > 0 && (
        <Stack gap="2">
          <Alert.Root status={result.committed ? 'warning' : 'error'} size="sm">
            <Alert.Indicator />
            <Alert.Description>
              {result.committed
                ? `${pluralize(result.invalid, 'row')} with errors were skipped.`
                : `${pluralize(result.invalid, 'row')} ${result.invalid === 1 ? 'has' : 'have'} errors. Fix the file, or import only the valid rows.`}
            </Alert.Description>
          </Alert.Root>
          <Table.ScrollArea borderWidth="1px" borderColor="rule" rounded="md" maxH="64">
            <Table.Root size="sm" stickyHeader>
              <Table.Header>
                <Table.Row bg="canvas">
                  <Table.ColumnHeader w="16">Row</Table.ColumnHeader>
                  <Table.ColumnHeader>Problem</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {result.errors.slice(0, 100).flatMap((e) =>
                  Object.entries(e.fields).map(([field, message]) => (
                    <Table.Row key={`${e.row}-${field}`}>
                      <Table.Cell fontVariantNumeric="tabular-nums">{e.row}</Table.Cell>
                      <Table.Cell>
                        <Text as="span" fontWeight="600" mr="2">
                          {headerFor[field] ?? field}
                        </Text>
                        {message}
                      </Table.Cell>
                    </Table.Row>
                  )),
                )}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
          {result.invalid > 100 && (
            <Text textStyle="xs" color="inkMuted">
              Showing the first 100 rows with errors.
            </Text>
          )}
        </Stack>
      )}
    </Stack>
  );
}
