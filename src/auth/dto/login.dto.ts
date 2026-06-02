import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  password: string;
}
