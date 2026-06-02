import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'string' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'string' })
  @IsString()
  @IsNotEmpty()
  surname!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  @IsIn(['uk', 'en']) 
  lang?: string;
}
