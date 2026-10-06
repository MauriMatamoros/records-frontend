import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface Props {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: Props) {
  return (
    <Flex
      align={{ base: 'flex-start', md: 'flex-end' }}
      justify="space-between"
      gap="4"
      direction={{ base: 'column', md: 'row' }}
      pb="5"
      mb="5"
      borderBottomWidth="1px"
      borderColor="rule"
    >
      <Box minW="0">
        <Heading
          as="h1"
          fontSize={{ base: '2xl', md: '3xl' }}
          fontWeight="700"
          letterSpacing="-0.02em"
          lineHeight="1.15"
        >
          {title}
        </Heading>
        {description && (
          <Text mt="1.5" color="inkMuted" maxW="65ch">
            {description}
          </Text>
        )}
      </Box>
      {actions && (
        <Flex gap="2" wrap="wrap" flexShrink={0}>
          {actions}
        </Flex>
      )}
    </Flex>
  );
}
