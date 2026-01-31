import { FastifyRequest } from 'fastify';
import { Role } from '../enums/role.enum.js';
import { UserStatus } from '../enums/userStatus.enum.js';
import { UserType } from '../models/user/user.schema.js';
import { Pagination } from './entity.interface.js';

export type CreateUserRequest = FastifyRequest<{
  Body: CreateUserInput;
}>;

export type CreateUserResponse = {
  userId: string;
};

export type GetUserInput = {
  userId?: string;
  emailId?: string;
};

export type GetUserPayload = {
  user?: UserType | null;
};

export type CreateUserInput = {
  name?: string;
  emailId: string;
  status?: UserStatus;
  roles?: Role[];
};

export type GetAllUsersInput = {
  searchText?: string;
  emailIds?: string[];
  roles?: Role[];
  pagination?: Pagination;
};

export type GetAllUsersRequest = FastifyRequest<{
  Querystring: GetAllUsersInput;
}>;

export type GetAllUsersPayload = {
  users: UserType[];
};

export type GetUserRequest = FastifyRequest<{
  Params: {
    id: string;
  };
}>;

export type UpdateUserRequest = FastifyRequest<{
  Params: {
    id: string;
  };
  Body: Partial<CreateUserInput>;
}>;
