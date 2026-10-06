import {
  AlignLeft,
  AtSign,
  Calendar,
  CircleCheck,
  CircleDot,
  Hash,
  Link,
  ListChecks,
  Type,
  type LucideIcon,
} from 'lucide-react';
import type { ColumnType, FilterOperator } from './types';

export const COLUMN_TYPES: { type: ColumnType; label: string; icon: LucideIcon; hint: string }[] = [
  { type: 'TEXT', label: 'Text', icon: Type, hint: 'A single line, up to 1,000 characters' },
  { type: 'LONG_TEXT', label: 'Long text', icon: AlignLeft, hint: 'Notes and paragraphs' },
  { type: 'NUMBER', label: 'Number', icon: Hash, hint: 'Integers or decimals' },
  { type: 'SELECT', label: 'Single select', icon: CircleDot, hint: 'One option from a list' },
  { type: 'MULTI_SELECT', label: 'Multiple select', icon: ListChecks, hint: 'Any options from a list' },
  { type: 'DATE', label: 'Date', icon: Calendar, hint: 'Calendar date' },
  { type: 'BOOLEAN', label: 'Checkbox', icon: CircleCheck, hint: 'Yes or no' },
  { type: 'EMAIL', label: 'Email', icon: AtSign, hint: 'Stored in lowercase' },
  { type: 'URL', label: 'URL', icon: Link, hint: 'http or https link' },
];

export const columnTypeInfo = (type: ColumnType) =>
  COLUMN_TYPES.find((t) => t.type === type) ?? COLUMN_TYPES[0];

/** Types that can be unique or the primary key (mirrors the backend's KEYABLE_TYPES). */
export const KEYABLE: ReadonlySet<ColumnType> = new Set(['TEXT', 'NUMBER', 'DATE', 'URL', 'EMAIL']);

/** Wording depends on the column type, e.g. "is after" for dates. */
export function operatorLabel(op: FilterOperator, type: ColumnType | 'TIMESTAMP'): string {
  const isDate = type === 'DATE' || type === 'TIMESTAMP';
  const isMulti = type === 'MULTI_SELECT';
  switch (op) {
    case 'eq':
      return isMulti ? 'has' : 'is';
    case 'neq':
      return isMulti ? 'doesn’t have' : 'is not';
    case 'contains':
      return 'contains';
    case 'ncontains':
      return 'doesn’t contain';
    case 'startsWith':
      return 'starts with';
    case 'gt':
      return isDate ? 'is after' : '>';
    case 'gte':
      return isDate ? 'is on or after' : '≥';
    case 'lt':
      return isDate ? 'is before' : '<';
    case 'lte':
      return isDate ? 'is on or before' : '≤';
    case 'in':
      return isMulti ? 'has any of' : 'is any of';
    case 'empty':
      return 'is empty';
  }
}
