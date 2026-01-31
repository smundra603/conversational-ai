/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyParamConstructor, DocumentType } from '@typegoose/typegoose/lib/types.js';
import {
  AnyKeys,
  ClientSession,
  DeleteResult,
  Query,
  QueryFilter,
  QueryOptions,
  SchemaOptions,
  Types,
  UpdateQuery,
} from 'mongoose';
import { Context } from './context.interface.js';

export type StringObjectID = string | Types.ObjectId;
export type ModelDocument<T extends AnyParamConstructor<T>> = DocumentType<InstanceType<T>>;

export interface GetTenantMongoConnectionProps {
  workspaceId: string;
}

export interface CustomSchemaOptions extends SchemaOptions {
  collection: string;
  // enableMongoDateConversion?: boolean;
  // unionConfig?: CustomUnionSchemaConfig;
}

export interface GetEntityMongoModelProps<T extends AnyParamConstructor<any>> {
  modelClass: T;
  tenantId: string;
  schemaOptions: CustomSchemaOptions;
  cacheModel: boolean;
  useGlobalClient: boolean;
  useDefaultConnection?: boolean;
}

export interface ModelOptions {
  schemaOptions: SchemaOptions;
  cacheModel?: boolean;
}

export interface BaseCrudInput<T extends AnyParamConstructor<InstanceType<T>>> {
  modelClass: T;
  schemaOptions: SchemaOptions;
  cacheModel?: boolean;
  useGlobalClient?: boolean;
}

export interface FindById {
  id: StringObjectID;
  projection?: object;
  context: Context;
}

export interface Aggregation {
  aggregations: any[];
  context: Context;
}

export type SortOrder = -1 | 1 | 'asc' | 'ascending' | 'desc' | 'descending';

export interface FindAll<T> {
  query: QueryFilter<DocumentType<T>>;
  options?: QueryOptions<T> | null;
  projection?: object;
  context: Context;
  limit?: number;
  offset?: number;
  sortQuery?: Record<any, SortOrder>;
}

export interface Find<T> {
  query: QueryFilter<DocumentType<T>>;
  projection?: object;
  options?: QueryOptions<T> | (null & { allowEmptyQuery?: boolean });
  limit?: number;
  offset?: number;
  sortQuery?: Record<any, SortOrder>;
  context: Context;
}

export interface FindOne<T> {
  query: QueryFilter<DocumentType<T>>;
  options?: QueryOptions<T> | (null & { allowEmptyQuery?: boolean });
  projection?: object;
  context: Context;
}

export interface Count<T> {
  query: QueryFilter<DocumentType<T>>;
  context: Context;
}

export interface Update<T> {
  query: QueryFilter<T>;
  updateQuery: UpdateQuery<T>;
  options?: QueryOptions<T> | null;
  context: Context;
}

export type RemoveResponse<T> = Query<DeleteResult, T>;

export interface Create<T> {
  doc: AnyKeys<T> | T;
  context: Context;
}

// export interface Create {
//   doc: any;
//   context: Context;
// }

export interface FindOneAndUpdate<T> {
  query: QueryFilter<T>;
  updateQuery: UpdateQuery<T>;
  options: Omit<QueryOptions<T> | null, 'upsert'>;
  context: Context;
}

export type ModelInstance<T extends AnyParamConstructor<T>> = InstanceType<T>;

// export type AnyParamConstructor<T> = new (...args: any) => T;

export type DocumentInstance<T extends AnyParamConstructor<T>> = DocumentType<InstanceType<T>>;

export interface Distinct<T> {
  field: string;
  query: QueryFilter<DocumentType<T>>;
}

export interface InsertMany<T> {
  docs: T[];
  options: { ordered?: boolean; rawResult?: boolean; session?: ClientSession | null };
}

export interface Remove<T> {
  query: QueryFilter<DocumentType<T>>;
  context: Context;
}

export type FilterQuery<T> = QueryFilter<DocumentType<T>>;

export type Pagination = {
  limit?: number;
  offset?: number;
};
