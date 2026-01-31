import mongoose from 'mongoose';
import { Scope } from '../enums/scope.enum.js';

export type Context = {
  requestId: string;
  userId: string;
  tenantId: string;
  session?: mongoose.ClientSession;
  scopes?: Scope[];
};
