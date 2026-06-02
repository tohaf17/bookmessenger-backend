import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthResponse } from './dto/auth.response';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { UserResponse } from '../user/responses/user.response';
import type { AuthRequest } from './auth-request.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register ordinary user' })
  @ApiCreatedResponse({ type: AuthResponse })
  register(
    @Body() dto: RegisterDto,
    @Headers('accept-language') acceptLanguage?: string
  ) {
    return this.authService.register(dto, acceptLanguage);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login user' })
  @ApiOkResponse({ type: AuthResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiOkResponse({ type: UserResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(AuthGuard('jwt'))
  me(@Request() req: AuthRequest) {
    return new UserResponse(req.user);
  }
}
