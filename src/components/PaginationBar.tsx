'use client';

import {
  ButtonGroup,
  HStack,
  IconButton,
  NativeSelect,
  Pagination,
  Text,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@/lib/types';

export const PAGE_SIZES = [25, 50, 100, 200];

interface Props {
  meta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  noun?: string;
}

export function PaginationBar({ meta, onPageChange, onPageSizeChange, noun = 'items' }: Props) {
  if (!meta) return null;
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <HStack justify="space-between" gap="4" wrap="wrap" py="3">
      <Text textStyle="sm" color="inkMuted">
        {meta.total === 0
          ? `No ${noun}`
          : `${from.toLocaleString()}–${to.toLocaleString()} of ${meta.total.toLocaleString()} ${noun}`}
      </Text>
      <HStack gap="3">
        {onPageSizeChange && (
          <NativeSelect.Root size="sm" width="auto">
            <NativeSelect.Field
              aria-label="Rows per page"
              value={meta.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.currentTarget.value))}
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} per page
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        )}
        {meta.totalPages > 1 && (
          <Pagination.Root
            count={meta.total}
            pageSize={meta.pageSize}
            page={meta.page}
            siblingCount={1}
            onPageChange={(e) => onPageChange(e.page)}
          >
            <ButtonGroup variant="ghost" size="sm" attached={false}>
              <Pagination.PrevTrigger asChild>
                <IconButton aria-label="Previous page">
                  <ChevronLeft />
                </IconButton>
              </Pagination.PrevTrigger>
              <Pagination.Items
                render={(page) => (
                  <IconButton
                    aria-label={`Page ${page.value}`}
                    variant={{ base: 'ghost', _selected: 'outline' }}
                  >
                    {page.value}
                  </IconButton>
                )}
              />
              <Pagination.NextTrigger asChild>
                <IconButton aria-label="Next page">
                  <ChevronRight />
                </IconButton>
              </Pagination.NextTrigger>
            </ButtonGroup>
          </Pagination.Root>
        )}
      </HStack>
    </HStack>
  );
}
