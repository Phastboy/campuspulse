import { IsNumber, IsString, IsOptional } from 'class-validator';

export class MediaDto {
  @IsString()
  url!: string;

  @IsString()
  fileId!: string;

  @IsOptional()
  @IsNumber()
  order?: number | null;
}
