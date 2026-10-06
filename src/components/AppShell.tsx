'use client';

import { Avatar, Box, Flex, IconButton, Link, Spinner, Stack, Text } from '@chakra-ui/react';
import { History, KeyRound, LogOut, Moon, Sun, Table2, Users } from 'lucide-react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

const NAV = [
  { href: '/tables', label: 'Tables', icon: Table2 },
  { href: '/users', label: 'People', icon: Users },
  { href: '/tokens', label: 'API tokens', icon: KeyRound },
  { href: '/logs', label: 'Activity log', icon: History },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  if (isLoading || !user) {
    return (
      <Flex minH="100dvh" align="center" justify="center">
        <Spinner color="ledger.solid" />
      </Flex>
    );
  }

  return (
    <Flex minH="100dvh" direction={{ base: 'column', lg: 'row' }}>
      <Flex
        as="nav"
        aria-label="Main"
        direction={{ base: 'row', lg: 'column' }}
        align={{ base: 'center', lg: 'stretch' }}
        gap={{ base: '1', lg: '6' }}
        w={{ base: 'full', lg: '60' }}
        flexShrink={0}
        px={{ base: '3', lg: '4' }}
        py={{ base: '2', lg: '6' }}
        bg="surface"
        borderColor="rule"
        borderRightWidth={{ base: 0, lg: '1px' }}
        borderBottomWidth={{ base: '1px', lg: 0 }}
        position={{ lg: 'sticky' }}
        top="0"
        h={{ lg: '100dvh' }}
        overflowX={{ base: 'auto', lg: 'visible' }}
      >
        <Text
          fontWeight="800"
          fontSize={{ base: 'md', lg: 'xl' }}
          letterSpacing="-0.03em"
          px="2"
          color="ledger.fg"
          flexShrink={0}
        >
          Records
        </Text>

        <Stack direction={{ base: 'row', lg: 'column' }} gap="0.5" flex="1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                asChild
                display="flex"
                alignItems="center"
                gap="2.5"
                px="2.5"
                py="2"
                rounded="md"
                fontSize="sm"
                fontWeight={active ? '600' : '500'}
                color={active ? 'ledger.fg' : 'inkMuted'}
                bg={active ? 'ledger.subtle' : 'transparent'}
                whiteSpace="nowrap"
                _hover={{ bg: 'ledger.subtle', color: 'ledger.fg', textDecoration: 'none' }}
                aria-current={active ? 'page' : undefined}
              >
                <NextLink href={href}>
                  <Icon size={16} aria-hidden />
                  {label}
                </NextLink>
              </Link>
            );
          })}
        </Stack>

        <Flex align="center" gap="2" px={{ lg: '1' }} flexShrink={0}>
          <Avatar.Root size="xs" display={{ base: 'none', lg: 'flex' }}>
            <Avatar.Fallback name={user.name ?? user.email} />
            {user.avatarUrl && <Avatar.Image src={user.avatarUrl} />}
          </Avatar.Root>
          <Box flex="1" minW="0" display={{ base: 'none', lg: 'block' }}>
            <Text textStyle="xs" fontWeight="600" truncate>
              {user.name ?? user.email.split('@')[0]}
            </Text>
            <Text textStyle="xs" color="inkMuted" truncate>
              {user.email}
            </Text>
          </Box>
          <IconButton
            aria-label={resolvedTheme === 'dark' ? 'Use light theme' : 'Use dark theme'}
            variant="ghost"
            size="xs"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
          </IconButton>
          <IconButton aria-label="Sign out" variant="ghost" size="xs" onClick={logout}>
            <LogOut />
          </IconButton>
        </Flex>
      </Flex>

      <Box as="main" flex="1" minW="0" px={{ base: '4', md: '8' }} py={{ base: '5', md: '8' }}>
        {children}
      </Box>
    </Flex>
  );
}
