import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentIdentity, type RequestIdentity } from '@odysseon/whoami-adapter-nestjs';
import { UsersService } from '../../use-cases/users.service.js';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  @Get('me')
  async getProfile(@CurrentIdentity() identity: RequestIdentity) {
    return this.usersService.getMyProfile(identity.accountId);
  }

  @ApiOperation({ summary: 'Update the currently authenticated user profile' })
  @Patch('me')
  async updateProfile(
    @CurrentIdentity() identity: RequestIdentity,
    @Body() payload: UpdateUserProfileDto,
  ) {
    return this.usersService.updateMyProfile(identity.accountId, payload);
  }
}
