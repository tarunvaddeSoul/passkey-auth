import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ClassSerializerInterceptor,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PasskeyService } from './passkey.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterOptionsDto } from './dto/register-options.dto';
import { RegisterVerificationDto } from './dto/register-verification.dto';
import { ResponseInterceptor } from 'src/interceptor/response.interceptor';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Passkey Authentication')
@Controller('auth/passkey')
@UseInterceptors(ClassSerializerInterceptor, ResponseInterceptor)
@UseGuards(ThrottlerGuard)
export class PasskeyController {
  constructor(private readonly passkeyService: PasskeyService) {}

  @ApiOperation({
    summary: 'Generate WebAuthn registration options',
    description:
      'This endpoint returns the options required for WebAuthn credential registration.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration options generated successfully',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many requests',
  })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async getRegistrationOptions(@Body() dto: RegisterOptionsDto) {
    return this.passkeyService.generateRegistrationOptions(dto.email);
  }

  @ApiOperation({
    summary: 'Verify WebAuthn registration',
    description: 'This endpoint verifies the WebAuthn registration response.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid registration response',
  })
  @Post('register/verification')
  @HttpCode(HttpStatus.OK)
  async verifyRegistration(@Body() dto: RegisterVerificationDto) {
    return this.passkeyService.verifyRegistration(dto.email, dto.response);
  }

  @ApiOperation({
    summary: 'Generate WebAuthn authentication options',
    description:
      'This endpoint returns the options required for WebAuthn authentication.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authentication options generated successfully',
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async getAuthenticationOptions(@Body() dto: RegisterOptionsDto) {
    return this.passkeyService.generateAuthenticationOptions(dto.email);
  }

  @ApiOperation({
    summary: 'Verify WebAuthn authentication',
    description: 'This endpoint verifies the WebAuthn authentication response.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authentication verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication failed',
  })
  @Post('login/verification')
  @HttpCode(HttpStatus.OK)
  async verifyAuthentication(@Body() dto: RegisterVerificationDto) {
    return this.passkeyService.verifyAuthentication(dto.email, dto.response);
  }
}
