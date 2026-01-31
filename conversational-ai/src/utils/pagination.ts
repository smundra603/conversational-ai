import { QueryOptions } from 'mongoose';
import { Pagination } from '../interfaces/entity.interface.js';

export function buildPaginationOption<T>(pagination: Pagination | undefined): QueryOptions<T> {
  const options: QueryOptions<T> = {};
  if (pagination?.limit !== undefined) {
    options.limit = pagination.limit;
  }

  if (pagination?.offset !== undefined) {
    options.skip = pagination.offset;
  }

  return options;
}
