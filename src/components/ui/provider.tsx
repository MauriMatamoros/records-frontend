'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { ApiError, fetcher } from '@/lib/api';
import { system } from '@/lib/theme';
import { Toaster } from './toaster';

export function Provider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange>
      <ChakraProvider value={system}>
        <SWRConfig
          value={{
            fetcher,
            keepPreviousData: true,
            revalidateOnFocus: true,
            shouldRetryOnError: (err) =>
              !(err instanceof ApiError && err.status < 500),
          }}
        >
          {children}
          <Toaster />
        </SWRConfig>
      </ChakraProvider>
    </ThemeProvider>
  );
}
