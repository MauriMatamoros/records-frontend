'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import useSWR, { type KeyedMutator } from 'swr';
import { toastError } from '@/components/ui/toaster';
import { api, viewSearchParams, withQuery, type FilterCondition, type ViewQuery } from '@/lib/api';
import type { ColumnTypeInfo, Paginated, Row, RowData, Table } from '@/lib/types';
import { useUrlState } from '@/lib/useUrlState';

const SEP = '~';

/** Filters live in the URL as repeated `f=field~op~value` params. */
function parseFilters(values: string[]): FilterCondition[] {
  return values.flatMap((raw, i) => {
    const [field, op, ...rest] = raw.split(SEP);
    return field && op ? [{ id: `f${i}`, field, op, value: rest.join(SEP) }] : [];
  });
}

interface TableContextValue {
  table: Table | undefined;
  tableError: unknown;
  mutateTable: KeyedMutator<Table>;
  columnTypes: ColumnTypeInfo[];
  view: Required<Pick<ViewQuery, 'page' | 'pageSize' | 'q' | 'sort' | 'match'>> & {
    filters: FilterCondition[];
  };
  setView: (changes: Partial<TableContextValue['view']>) => void;
  /** Same query string as the grid, for exports. */
  viewParams: URLSearchParams;
  rows: Paginated<Row> | undefined;
  rowsLoading: boolean;
  mutateRows: KeyedMutator<Paginated<Row>>;
  /** Optimistically updates cells; reverts and toasts on failure. */
  updateRow: (rowId: string, data: RowData) => Promise<boolean>;
  /** Refreshes rows and table metadata (counts, columns). */
  refresh: () => void;
}

const TableContext = createContext<TableContextValue | null>(null);

export function TableProvider({ tableId, children }: { tableId: string; children: ReactNode }) {
  const { params, get, set, replace, page } = useUrlState();

  const view = useMemo(
    () => ({
      page,
      pageSize: Number(get('pageSize')) || 50,
      q: get('q'),
      sort: get('sort'),
      match: (get('match') === 'any' ? 'any' : 'all') as 'all' | 'any',
      filters: parseFilters(params.getAll('f')),
    }),
    [get, page, params],
  );

  const setView = useCallback(
    (changes: Partial<TableContextValue['view']>) => {
      const { filters, ...rest } = changes;
      if (!filters) return set(rest);
      // `f` repeats, so rebuild it separately from the scalar params.
      const next = new URLSearchParams(params.toString());
      next.delete('f');
      next.delete('page');
      for (const f of filters) next.append('f', [f.field, f.op, f.value].join(SEP));
      for (const [k, v] of Object.entries(rest)) {
        if (v === undefined || v === '') next.delete(k);
        else next.set(k, String(v));
      }
      replace(next);
    },
    [params, replace, set],
  );

  const viewParams = useMemo(() => viewSearchParams(view), [view]);

  const { data: table, error: tableError, mutate: mutateTable } = useSWR<Table>(`/api/tables/${tableId}`);
  const { data: columnTypes = [] } = useSWR<ColumnTypeInfo[]>('/api/meta/column-types', {
    revalidateOnFocus: false,
  });
  const rowsKey = table ? withQuery(`/api/tables/${tableId}/rows`, viewParams) : null;
  const { data: rows, isLoading: rowsLoading, mutate: mutateRows } = useSWR<Paginated<Row>>(rowsKey);

  const updateRow = useCallback(
    async (rowId: string, data: RowData) => {
      const patch = (current: Paginated<Row> | undefined): Paginated<Row> =>
        current
          ? {
              ...current,
              items: current.items.map((r) =>
                r.id === rowId ? { ...r, data: stripNulls({ ...r.data, ...data }) } : r,
              ),
            }
          : { items: [], meta: { page: 1, pageSize: 50, total: 0, totalPages: 1 } };
      try {
        await mutateRows(
          async (current) => {
            const updated = await api<Row>(`/api/tables/${tableId}/rows/${rowId}`, {
              method: 'PATCH',
              body: { data },
            });
            return current && { ...current, items: current.items.map((r) => (r.id === rowId ? updated : r)) };
          },
          { optimisticData: patch, rollbackOnError: true, revalidate: false },
        );
        return true;
      } catch (err) {
        const labels = Object.fromEntries((table?.columns ?? []).map((c) => [c.key, c.name]));
        toastError(err, 'Change not saved', labels);
        return false;
      }
    },
    [mutateRows, table, tableId],
  );

  const refresh = useCallback(() => {
    void mutateRows();
    void mutateTable();
  }, [mutateRows, mutateTable]);

  return (
    <TableContext.Provider
      value={{
        table,
        tableError,
        mutateTable,
        columnTypes,
        view,
        setView,
        viewParams,
        rows,
        rowsLoading,
        mutateRows,
        updateRow,
        refresh,
      }}
    >
      {children}
    </TableContext.Provider>
  );
}

function stripNulls(data: RowData): RowData {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null && v !== ''));
}

export function useTable(): TableContextValue {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error('useTable must be used inside <TableProvider>');
  return ctx;
}
