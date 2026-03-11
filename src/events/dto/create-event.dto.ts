import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDateString()
  date!: string;

  @IsString()
  @IsNotEmpty()
  venue!: string;
}
