import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsString, Matches, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek, OperatingHours } from '../../domain/types/operating-hours.types.js';

export class SetOperatingHoursItemDto {
  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  day!: DayOfWeek;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'openTime must be in HH:mm format' })
  openTime!: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'closeTime must be in HH:mm format' })
  closeTime!: string;

  @ApiProperty()
  @IsBoolean()
  isClosed!: boolean;
}

export class SetOperatingHoursDto {
  @ApiProperty({ type: [SetOperatingHoursItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetOperatingHoursItemDto)
  hours!: SetOperatingHoursItemDto[];
}

export class OperatingHoursDto {
  @ApiProperty() id: string;
  @ApiProperty() businessProfileId: string;
  @ApiProperty({ enum: DayOfWeek }) day: DayOfWeek;
  @ApiProperty() openTime: string;
  @ApiProperty() closeTime: string;
  @ApiProperty() isClosed: boolean;

  private constructor(h: OperatingHours) {
    this.id = h.id;
    this.businessProfileId = h.businessProfileId;
    this.day = h.day;
    this.openTime = h.openTime;
    this.closeTime = h.closeTime;
    this.isClosed = h.isClosed;
  }

  static from(h: OperatingHours): OperatingHoursDto {
    return new OperatingHoursDto(h);
  }
}
