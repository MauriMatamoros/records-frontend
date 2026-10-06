import { Flex } from '@chakra-ui/react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <Flex minH="100dvh" align="center" justify="center" px="4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </Flex>
  );
}
