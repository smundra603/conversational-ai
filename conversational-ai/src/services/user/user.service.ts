import { Context } from '../../interfaces/context.interface.js';
import { CreateUserInput, GetAllUsersInput, GetUserInput } from '../../interfaces/user.interface.js';
import { userRepository } from '../../models/user/user.repository.js';
import { UserType } from '../../models/user/user.schema.js';
import logger from '../../utils/logger.js';

class UserService {
  async getUser(userInput: GetUserInput, context: Context): Promise<UserType | null> {
    const user = await userRepository.getUser(userInput, context);
    // Implement your authentication logic here
    return user;
  }

  async createUser(input: CreateUserInput, context: Context): Promise<UserType | undefined> {
    try {
      const createdUser = await userRepository.createUser({ ...input }, context);
      if (!createdUser) {
        return;
      }
      return createdUser;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers(input: GetAllUsersInput, context: Context): Promise<UserType[]> {
    const users = await userRepository.getAllUsers(input, context);
    return users;
  }

  async updateUser(id: string, input: Partial<CreateUserInput>, context: Context): Promise<UserType | null> {
    const updatedUser = await userRepository.updateUser(id, input, context);
    return updatedUser;
  }
}

export const userService = new UserService();
