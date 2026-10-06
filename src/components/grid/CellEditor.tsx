'use client';

import { Box, Button, Checkbox, Input, NativeSelect, Stack, Textarea } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import type { Column } from '@/lib/types';

interface Props {
  column: Column;
  value: unknown;
  /** Called with the new JSON value (null clears the cell). */
  onCommit: (value: unknown) => void;
  onCancel: () => void;
}

const INPUT_TYPE: Partial<Record<Column['type'], string>> = {
  NUMBER: 'number',
  DATE: 'date',
  EMAIL: 'email',
  URL: 'url',
};

/** Converts editor text back into the column's JSON type. */
export function fromInput(column: Column, text: string): unknown {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  if (column.type === 'NUMBER') {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : trimmed;
  }
  return column.type === 'LONG_TEXT' ? text : trimmed;
}

const toText = (v: unknown) => (v === undefined || v === null ? '' : String(v));

/** In-cell editor. Enter/blur saves, Escape cancels. */
export function CellEditor({ column, value, onCommit, onCancel }: Props) {
  const done = useRef(false);
  const finish = (next: unknown) => {
    if (done.current) return;
    done.current = true;
    onCommit(next);
  };
  const cancel = () => {
    done.current = true;
    onCancel();
  };

  if (column.type === 'SELECT') {
    return (
      <NativeSelect.Root size="xs">
        <NativeSelect.Field
          autoFocus
          aria-label={column.name}
          defaultValue={toText(value)}
          onChange={(e) => finish(e.currentTarget.value || null)}
          onBlur={() => cancel()}
          onKeyDown={(e) => e.key === 'Escape' && cancel()}
        >
          <option value="">—</option>
          {column.options.choices?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    );
  }

  if (column.type === 'MULTI_SELECT') {
    return <MultiSelectEditor column={column} value={value} onCommit={finish} onCancel={cancel} />;
  }

  if (column.type === 'LONG_TEXT') {
    return (
      <Textarea
        autoFocus
        size="xs"
        aria-label={column.name}
        defaultValue={toText(value)}
        rows={5}
        position="absolute"
        insetX="0"
        top="0"
        zIndex="2"
        bg="surface"
        shadow="md"
        onBlur={(e) => finish(fromInput(column, e.currentTarget.value))}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancel();
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) finish(fromInput(column, e.currentTarget.value));
        }}
      />
    );
  }

  return (
    <Input
      autoFocus
      size="xs"
      aria-label={column.name}
      type={INPUT_TYPE[column.type] ?? 'text'}
      step={column.type === 'NUMBER' ? 'any' : undefined}
      defaultValue={toText(value)}
      onFocus={(e) => column.type !== 'DATE' && e.currentTarget.select()}
      onBlur={(e) => finish(fromInput(column, e.currentTarget.value))}
      onKeyDown={(e) => {
        if (e.key === 'Escape') cancel();
        if (e.key === 'Enter') finish(fromInput(column, e.currentTarget.value));
      }}
    />
  );
}

function MultiSelectEditor({ column, value, onCommit, onCancel }: Props) {
  const [selected, setSelected] = useState<string[]>(Array.isArray(value) ? (value as string[]) : []);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector('input')?.focus();
  }, []);

  return (
    <Box
      ref={ref}
      position="absolute"
      top="0"
      left="0"
      minW="full"
      zIndex="2"
      bg="surface"
      borderWidth="1px"
      borderColor="rule"
      rounded="md"
      shadow="md"
      p="2"
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <Stack gap="1.5" maxH="56" overflowY="auto">
        {column.options.choices?.map((c) => (
          <Checkbox.Root
            key={c}
            size="sm"
            checked={selected.includes(c)}
            onCheckedChange={(e) =>
              setSelected((s) => (e.checked ? [...s, c] : s.filter((x) => x !== c)))
            }
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>{c}</Checkbox.Label>
          </Checkbox.Root>
        ))}
      </Stack>
      <Stack direction="row" mt="2" justify="flex-end" gap="1">
        <Button size="2xs" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="2xs"
          colorPalette="ledger"
          onClick={() => onCommit(selected.length ? selected : null)}
        >
          Done
        </Button>
      </Stack>
    </Box>
  );
}
