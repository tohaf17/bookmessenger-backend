import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt-payload.type';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/user-role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'dev-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.getUserById(payload.sub);
    return {
      ...user,
      role: String(user.role).toLowerCase() as UserRole,
    };
  }
}
