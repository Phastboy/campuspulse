import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentIdentity, type RequestIdentity } from '@odysseon/whoami-adapter-nestjs';
import { UsersService } from '../../use-cases/users.service.js';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';
import { GetMyBusinessProfilesUseCase } from '../../../businesses/use-cases/get-my-business-profiles.use-case.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly getMyBusinessProfilesUseCase: GetMyBusinessProfilesUseCase,
  ) {}

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

  @ApiOperation({ summary: 'List business profiles owned by the current user' })
  @Get('me/businesses')
  async getMyBusinesses(@CurrentIdentity() identity: RequestIdentity) {
    return this.getMyBusinessProfilesUseCase.execute(identity.accountId);
  }
}
