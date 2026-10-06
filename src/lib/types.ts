// Mirrors the backend DTOs (see the Swagger docs at /api/docs).

export type ColumnType =
  | 'TEXT'
  | 'LONG_TEXT'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'DATE'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'URL'
  | 'EMAIL';

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'ncontains'
  | 'startsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'empty';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface UserRef {
  id: string;
  email: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  invitedBy: UserRef | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthConfig {
  googleEnabled: boolean;
  devLoginEnabled: boolean;
  allowedDomains: string[];
}

export interface Column {
  id: string;
  name: string;
  key: string;
  type: ColumnType;
  options: { choices?: string[] };
  order: number;
  required: boolean;
  unique: boolean;
  primary: boolean;
}

export interface TableSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  columnCount: number;
  rowCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Table {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  primaryKey: string | null;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export type RowData = Record<string, unknown>;

export interface Row {
  id: string;
  data: RowData;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnTypeInfo {
  type: ColumnType;
  operators: FilterOperator[];
  hasChoices: boolean;
  keyable: boolean;
}

export interface ApiToken {
  id: string;
  name: string;
  prefix: string;
  createdBy: UserRef | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface CreatedApiToken extends ApiToken {
  token: string;
}

export interface AuditLog {
  id: string;
  actorType: 'USER' | 'API_TOKEN' | 'SYSTEM';
  actorId: string | null;
  actorLabel: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  detail: unknown;
  ip: string | null;
  requestId: string | null;
  createdAt: string;
}

export interface ImportResult {
  dryRun: boolean;
  committed: boolean;
  totalRows: number;
  created: number;
  updated: number;
  unchanged: number;
  invalid: number;
  mappedColumns: { header: string; key: string }[];
  ignoredHeaders: string[];
  errors: { row: number; fields: Record<string, string> }[];
}

export interface CreateFromFileResult extends ImportResult {
  table: Table | null;
}
