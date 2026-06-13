import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentIdentity, type RequestIdentity } from '@odysseon/whoami-adapter-nestjs';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { SavesService } from '../../application/use-cases/saves.service.js';

@ApiTags('Saves (Public)')
@Controller('users/me/saves')
@ApiBearerAuth()
export class SavesController {
  constructor(
    private readonly savesService: SavesService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveUserId(accountId: string) {
    const user = await this.prisma.user.findUnique({ where: { accountId } });
    if (!user) throw new Error('User not found');
    return user.id;
  }

  @Get('listings')
  @ApiOperation({ summary: 'Get saved listings' })
  async getSavedListings(@CurrentIdentity() identity: RequestIdentity) {
    const userId = await this.resolveUserId(identity.accountId);
    return this.savesService.getSavedListings(userId);
  }

  @Post('listings/:id')
  @ApiOperation({ summary: 'Toggle listing save state' })
  async saveListing(@CurrentIdentity() identity: RequestIdentity, @Param('id') listingId: string) {
    const userId = await this.resolveUserId(identity.accountId);
    return this.savesService.toggleListingSave(userId, listingId);
  }

  @Delete('listings/:id')
  @ApiOperation({ summary: 'Unsave listing (alias for toggle)' })
  async unsaveListing(@CurrentIdentity() identity: RequestIdentity, @Param('id') listingId: string) {
    const userId = await this.resolveUserId(identity.accountId);
    return this.savesService.toggleListingSave(userId, listingId);
  }

  @Get('businesses')
  @ApiOperation({ summary: 'Get saved businesses' })
  async getSavedBusinesses(@CurrentIdentity() identity: RequestIdentity) {
    const userId = await this.resolveUserId(identity.accountId);
    return this.savesService.getSavedBusinesses(userId);
  }

  @Post('businesses/:id')
  @ApiOperation({ summary: 'Toggle business save state' })
  async saveBusiness(@CurrentIdentity() identity: RequestIdentity, @Param('id') businessId: string) {
    const userId = await this.resolveUserId(identity.accountId);
    return this.savesService.toggleBusinessSave(userId, businessId);
  }

  @Delete('businesses/:id')
  @ApiOperation({ summary: 'Unsave business (alias for toggle)' })
  async unsaveBusiness(@CurrentIdentity() identity: RequestIdentity, @Param('id') businessId: string) {
    const userId = await this.resolveUserId(identity.accountId);
    return this.savesService.toggleBusinessSave(userId, businessId);
  }

  @Get('check')
  @ApiOperation({ summary: 'Check if entities are saved' })
  async checkSaves(
    @CurrentIdentity() identity: RequestIdentity,
    @Query('listingId') listingId?: string,
    @Query('businessId') businessId?: string
  ) {
    const userId = await this.resolveUserId(identity.accountId);
    const result: any = {};
    if (listingId) {
      const map = await this.savesService.checkSavedListings(userId, [listingId]);
      result.listingSaved = !!map[listingId];
    }
    if (businessId) {
      const map = await this.savesService.checkSavedBusinesses(userId, [businessId]);
      result.businessSaved = !!map[businessId];
    }
    return result;
  }
}
