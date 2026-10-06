'use client';

import { Badge, HStack, Link, Text } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { formatDateCell } from '@/lib/format';
import type { Column } from '@/lib/types';

/** Read-only rendering of a stored cell value. */
export function CellValue({ column, value }: { column: Column; value: unknown }) {
  if (value === undefined || value === null || value === '') return null;

  switch (column.type) {
    case 'NUMBER':
      return (
        <Text as="span" display="block" textAlign="end" fontVariantNumeric="tabular-nums">
          {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 10 }) : String(value)}
        </Text>
      );
    case 'BOOLEAN':
      return value === true ? (
        <Check size={16} aria-label="Yes" color="var(--chakra-colors-ledger-solid)" />
      ) : null;
    case 'DATE':
      return <Text as="span">{formatDateCell(String(value))}</Text>;
    case 'SELECT':
      return (
        <Badge colorPalette="ledger" variant="subtle" maxW="full" truncate>
          {String(value)}
        </Badge>
      );
    case 'MULTI_SELECT':
      return (
        <HStack gap="1" overflow="hidden">
          {(Array.isArray(value) ? value : [value]).map((v) => (
            <Badge key={String(v)} variant="outline" flexShrink={0}>
              {String(v)}
            </Badge>
          ))}
        </HStack>
      );
    case 'URL':
      return (
        <Link
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          color="ledger.fg"
          truncate
          display="block"
          onClick={(e) => e.stopPropagation()}
        >
          {String(value).replace(/^https?:\/\//, '')}
        </Link>
      );
    default:
      return (
        <Text as="span" display="block" truncate>
          {String(value)}
        </Text>
      );
  }
}
