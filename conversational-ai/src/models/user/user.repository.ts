import { Types, UpdateQuery } from 'mongoose';
import { UserStatus } from '../../enums/userStatus.enum.js';
import { Context } from '../../interfaces/context.interface.js';
import { FilterQuery } from '../../interfaces/entity.interface.js';
import { CreateUserInput, GetAllUsersInput, GetUserInput } from '../../interfaces/user.interface.js';
import { EntityBaseCrud } from '../base/entity.repository.js';
import { UserType } from './user.schema.js';

export class UserRepository extends EntityBaseCrud<typeof UserType> {
  public constructor() {
    super({
      modelClass: UserType,
      schemaOptions: {
        collection: 'users',
        timestamps: true,
      },
      cacheModel: true,
    });
  }

  async createUser(userInput: CreateUserInput, context: Context): Promise<UserType | undefined> {
    const UserModel = await this.getModel(context, this.modelOptions);
    let createdById = new Types.ObjectId();
    if (context.userId && context.userId !== 'null') {
      createdById = new Types.ObjectId(context.userId);
    }

    const userDoc = new UserModel({
      ...userInput,
      createdById: createdById,
      updatedById: createdById,
    });

    const user = await this.create({
      doc: userDoc,
      context,
    });

    if (user) {
      return user;
    }
    return;
  }

  async updateUser(userId: string, updateData: Partial<CreateUserInput>, context: Context): Promise<UserType | null> {
    const updateQuery: UpdateQuery<UserType> = {
      $set: {
        ...updateData,
      },
    };

    const updatedUser = await this.findOneAndUpdate({
      query: { _id: new Types.ObjectId(userId) },
      updateQuery: updateQuery,
      options: { new: true },
      context,
    });

    return updatedUser;
  }

  async getUserById(context: Context, userId: string): Promise<UserType | null> {
    const user = await this.findById({
      id: new Types.ObjectId(userId),
      context,
    });
    return user;
  }

  async getAllUsers(input: GetAllUsersInput, context: Context): Promise<UserType[]> {
    const { emailIds } = input;
    const query: FilterQuery<UserType> = {
      status: UserStatus.ACTIVE,
    };
    if (emailIds && emailIds.length > 0) {
      query.emailId = { $in: emailIds };
    }

    if (input.searchText) {
      query.$or = [
        { name: { $regex: input.searchText, $options: 'i' } },
        { emailId: { $regex: input.searchText, $options: 'i' } },
      ];
    }

    if (input.roles && input.roles.length > 0) {
      query.roles = { $in: input.roles };
    }

    const pagination = this.buildPaginationOption(input.pagination);
    const users = await this.findAll({
      query,
      context,
      options: {
        ...pagination,
      },
    });

    return users;
  }

  async getUser(input: GetUserInput, context: Context): Promise<UserType | null> {
    const { emailId, userId } = input;
    const query: FilterQuery<UserType> = {};

    if (userId) {
      query._id = new Types.ObjectId(userId);
    }

    if (emailId) {
      query.emailId = emailId;
    }
    const user = await this.findOne({
      query,
      context,
    });

    return user;
  }
}

export const userRepository = new UserRepository();
