'use client';

import {
  Toaster as ChakraToaster,
  createToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
} from '@chakra-ui/react';
import { ApiError } from '@/lib/api';

export const toaster = createToaster({
  placement: 'bottom-end',
  pauseOnPageIdle: true,
});

/**
 * Shows an API error. Per-field messages are listed under their column names
 * when `labels` (key → name) is given.
 */
export function toastError(err: unknown, title = 'Something went wrong', labels: Record<string, string> = {}) {
  const fields = err instanceof ApiError ? Object.entries(err.fields) : [];
  const description =
    err instanceof ApiError
      ? fields.length
        ? fields.map(([k, v]) => `${labels[k] ?? k}: ${v}`).join('\n')
        : err.message
      : err instanceof Error
        ? err.message
        : String(err);
  toaster.create({ type: 'error', title, description, closable: true });
}

export function Toaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
        {(toast) => (
          <Toast.Root width={{ md: 'sm' }}>
            {toast.type === 'loading' ? (
              <Spinner size="sm" color="ledger.solid" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && (
                <Toast.Description whiteSpace="pre-line">
                  {toast.description}
                </Toast.Description>
              )}
            </Stack>
            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}
            {toast.closable && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
}
