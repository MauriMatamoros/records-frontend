'use client';

import { Input, InputGroup } from '@chakra-ui/react';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebounced } from '@/lib/useUrlState';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxW?: string;
}

/** Search box that reports changes after the user pauses typing. */
export function SearchInput({ value, onChange, placeholder, maxW = 'xs' }: Props) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  const debounced = useDebounced(draft);

  // Follow external changes (e.g. back/forward navigation) without an effect.
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [debounced]);

  return (
    <InputGroup startElement={<Search size={15} />} maxW={maxW} w="full">
      <Input
        size="sm"
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={draft}
        bg="surface"
        onChange={(e) => setDraft(e.target.value)}
      />
    </InputGroup>
  );
}
