'use client';

import {
  Alert,
  Box,
  Button,
  Field,
  Heading,
  Input,
  Separator,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';
import { api, ApiError } from '@/lib/api';
import type { AuthConfig } from '@/lib/types';

const ERRORS: Record<string, string> = {
  not_invited:
    'That Google account hasn’t been invited yet. Ask someone who already has access to invite you from the People page.',
  domain_not_allowed: 'Sign in with your company Google account.',
  email_unverified: 'Your Google account email isn’t verified.',
  google_denied: 'Google sign-in was cancelled.',
  state_mismatch: 'The sign-in session expired. Try again.',
  google_failed: 'Google sign-in failed. Try again.',
};

/** Only allow same-site relative redirects after login. */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/tables';
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const errorCode = params.get('error');
  const next = safeNext(params.get('next'));
  const { data: config } = useSWR<AuthConfig>('/api/auth/config');

  const [email, setEmail] = useState('');
  const [devError, setDevError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function devLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setDevError(null);
    try {
      await api('/api/auth/dev-login', { method: 'POST', body: { email } });
      router.replace(next);
    } catch (err) {
      setDevError(err instanceof ApiError ? err.message : 'Sign-in failed');
      setBusy(false);
    }
  }

  const domains = config?.allowedDomains.map((d) => `@${d}`).join(' or ');

  return (
    <Box
      w="full"
      maxW="sm"
      bg="surface"
      borderWidth="1px"
      borderColor="rule"
      rounded="lg"
      p={{ base: '6', md: '8' }}
    >
      <Stack gap="6">
        <Box>
          <Heading as="h1" fontSize="3xl" fontWeight="800" letterSpacing="-0.03em" color="ledger.fg">
            Records
          </Heading>
          <Text mt="1" color="inkMuted">
            Sign in to manage PartnerHero’s shared tables.
          </Text>
        </Box>

        {errorCode && (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Description>{ERRORS[errorCode] ?? 'Sign-in failed. Try again.'}</Alert.Description>
          </Alert.Root>
        )}

        <Stack gap="2">
          <Button
            asChild={config?.googleEnabled}
            colorPalette="ledger"
            size="lg"
            disabled={!config?.googleEnabled}
          >
            {config?.googleEnabled ? <a href="/api/auth/google">Sign in with Google</a> : 'Sign in with Google'}
          </Button>
          <Text textStyle="sm" color="inkMuted">
            {config && !config.googleEnabled
              ? 'Google sign-in isn’t configured on this server yet.'
              : domains
                ? `Use your ${domains} account. You need an invitation first.`
                : ' '}
          </Text>
        </Stack>

        {config?.devLoginEnabled && (
          <>
            <Separator />
            <form onSubmit={devLogin}>
              <Stack gap="3">
                <Field.Root invalid={!!devError}>
                  <Field.Label>Development sign-in</Field.Label>
                  <Input
                    type="email"
                    required
                    placeholder="admin@partnerhero.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Field.HelperText>Local only. Signs in as an existing user without Google.</Field.HelperText>
                  {devError && <Field.ErrorText>{devError}</Field.ErrorText>}
                </Field.Root>
                <Button type="submit" variant="outline" loading={busy}>
                  Sign in as this user
                </Button>
              </Stack>
            </form>
          </>
        )}
      </Stack>
    </Box>
  );
}
