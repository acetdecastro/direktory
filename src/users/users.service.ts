import {
  Injectable,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly logger: Logger;

  constructor(private readonly usersRepository: UsersRepository) {}

  private async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  async create(createUserInput: CreateUserInput) {
    try {
      // const now = new Date();
      return await this.usersRepository.create({
        ...createUserInput,
        // createdAt: now,
        // updatedAt: now,
        password: await this.hashPassword(createUserInput.password),
      });
    } catch (error) {
      if (error.message.includes('E11000')) {
        throw new UnprocessableEntityException('Email already exists.');
      }
      throw error;
    }
  }

  async findAll() {
    return this.usersRepository.find({});
  }

  async findOne(_id: string) {
    return this.usersRepository.findOne({ _id });
  }

  async update(_id: string, updateUserInput: UpdateUserInput) {
    if (updateUserInput.password) {
      updateUserInput.password = await this.hashPassword(
        updateUserInput.password,
      );
    }

    return this.usersRepository.findOneAndUpdate(
      { _id },
      {
        $set: {
          ...updateUserInput,
        },
      },
    );
  }

  async remove(_id: string) {
    return this.usersRepository.findOneAndDelete({ _id });
  }

  async verifyUser(email: string, password: string) {
    const user = await this.usersRepository.findOne({ email });
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      throw new UnauthorizedException('Credentials are not valid.');
    }
    return user;
  }
}