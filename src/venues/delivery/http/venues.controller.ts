import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { VenuesService } from '../../use-cases/venues.service.js';
import { GetVenuesFilterDto, CreateVenueDto } from './dto/index.js';
import { CurrentIdentity, Public, type RequestIdentity } from '@odysseon/whoami-adapter-nestjs';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  /**
   * Public endpoint to discover event centres.
   * Evaluates location, capacity, and price to power the core discovery loop.
   */
  @Public()
  @Get()
  async getVenues(@Query() filters: GetVenuesFilterDto) {
    return this.venuesService.discoverVenues(filters);
  }

  /**
   * Protected endpoint for Venue Owners to list their centres.
   * Associates the new venue with the authenticated Odysseon session.
   */
  @Post()
  async createVenue(@Body() payload: CreateVenueDto, @CurrentIdentity() identity: RequestIdentity) {
    return this.venuesService.createVenue(identity.accountId, payload);
  }
}
