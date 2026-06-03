import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthResponse } from './dto/auth.response';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserService } from '../user/user.service';
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
} from '../user/user.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async register(dto: RegisterDto,acceptLanguage?: string) {
    const email = dto.email.toLowerCase();
    let userLanguage=dto.lang;
    if(!userLanguage&&acceptLanguage){
      const detectedLanguage = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
      if(["uk","en"].includes(detectedLanguage)){
        userLanguage=detectedLanguage;
      }
    }
    userLanguage=userLanguage || 'uk';
    const existingUser = await this.userService.getByEmail(email);

    if (existingUser) {
      if (
        existingUser.email === DEFAULT_ADMIN_EMAIL &&
        (await bcrypt.compare(dto.password, existingUser.password)) &&
        dto.password === DEFAULT_ADMIN_PASSWORD
      ) {
        return this.createLoginResponse(existingUser.id, existingUser.email);
      }

      throw new ConflictException('User with this email already exists');
    }

    const user = await this.userService.createUser({
      name: dto.name,
      surname: dto.surname,
      email,
      password: dto.password,
      language: userLanguage,
    });

    return this.createLoginResponse(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.getByEmail(dto.email.toLowerCase());

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createLoginResponse(user.id, user.email);
  }

  private createLoginResponse(userId: number, email: string): AuthResponse {
    return {
      accessToken: this.jwtService.sign({ sub: userId, email }),
    };
  }
}
