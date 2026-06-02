import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../user.entity';
import { UserRole } from '../user-role.enum';

export class UserResponse {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  surname!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty()
  createdAt!: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.surname = user.surname;
    this.role = user.role;
    this.avatarUrl = user.avatarUrl;
    this.createdAt = user.createdAt;
  }
}
