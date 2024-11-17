import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsObject } from 'class-validator';

export class RegisterVerificationDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'WebAuthn attestation response',
  })
  @IsObject()
  @IsNotEmpty()
  response: any;
}
