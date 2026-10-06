'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

/**
 * Uploads `file` with `dryRun=true` and returns the server's validation report.
 * Keyed on the File object and options, so changing either re-checks the file
 * and stale responses are discarded automatically.
 */
export function useDryRun<T>(url: string | null, file: File | null, fields: Record<string, string | undefined>) {
  return useSWR<T>(
    url && file ? ['dry-run', url, file, JSON.stringify(fields)] : null,
    () => {
      const fd = new FormData();
      fd.append('file', file!);
      fd.append('dryRun', 'true');
      for (const [k, v] of Object.entries(fields)) if (v) fd.append(k, v);
      return api<T>(url!, { method: 'POST', body: fd });
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      keepPreviousData: false,
    },
  );
}
