import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserRequest {
  @ApiProperty({ example: 'reader@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'strong-password' })
  @IsString()
  password!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  surname!: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
