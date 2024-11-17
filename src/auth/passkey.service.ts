import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
} from '@simplewebauthn/server';
import { AuthenticatorTransportFuture } from '@simplewebauthn/server/script/deps';

@Injectable()
export class PasskeyService {
  private rpName: string;
  private rpID: string;
  private origin: string;

  constructor(private prisma: PrismaService, private config: ConfigService) {
    this.rpName = this.config.get<string>('RP_NAME');
    this.rpID = this.config.get<string>('RP_ID');
    this.origin = this.config.get<string>('ORIGIN');
  }

  async generateRegistrationOptions(email: string) {
    try {
      let user = await this.prisma.user.findUnique({
        where: { email },
        include: { authenticators: true },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: { email },
          include: { authenticators: true },
        });
      }

      const userID = new TextEncoder().encode(user.id);

      const excludeCredentials = user.authenticators.map((authenticator) => ({
        id: authenticator.credentialId,
        type: 'public-key' as const,
        transports: authenticator.transports as AuthenticatorTransportFuture[],
      }));

      const options: GenerateRegistrationOptionsOpts = {
        rpName: this.rpName,
        rpID: this.rpID,
        userID,
        userName: user.email,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials,
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required',
          // authenticatorAttachment: 'cross-platform',
        },
      };

      const registrationOptions = await generateRegistrationOptions(options);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { currentChallenge: registrationOptions.challenge },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Registration options generated',
        data: registrationOptions,
      };
    } catch (error) {
      console.error('Registration options error:', error);
      throw new BadRequestException('Failed to generate registration options');
    }
  }

  async verifyRegistration(email: string, response: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user?.currentChallenge) {
        throw new UnauthorizedException('Registration session not found');
      }

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      });

      if (verification.verified && verification.registrationInfo) {
        const { registrationInfo } = verification;
        const { credential } = registrationInfo;

        // Convert the credential public key to Buffer
        const publicKeyBuffer = Buffer.from(credential.publicKey);

        // Store the authenticator
        await this.prisma.authenticator.create({
          data: {
            userId: user.id,
            credentialId: credential.id,
            credentialPublicKey: publicKeyBuffer,
            counter: BigInt(credential.counter),
            credentialDeviceType: registrationInfo.credentialDeviceType,
            credentialBackedUp: registrationInfo.credentialBackedUp,
            transports: credential.transports || [],
          },
        });

        // Clear the challenge
        await this.prisma.user.update({
          where: { id: user.id },
          data: { currentChallenge: null, updatedAt: new Date() },
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Registration successful!',
          data: {
            verified: true,
          },
        };
      }

      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Registration unsuccessful!',
        data: { verified: false },
      };
    } catch (error) {
      console.error('Registration verification error:', error);
      throw new BadRequestException(
        `Registration verification failed: ${error.message}`,
      );
    }
  }

  async generateAuthenticationOptions(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { authenticators: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const allowCredentials = user.authenticators.map((authenticator) => ({
        id: authenticator.credentialId,
        transports: authenticator.transports as AuthenticatorTransportFuture[],
      }));

      const options: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials,
        userVerification: 'preferred',
        rpID: this.rpID,
      };

      const authenticationOptions = await generateAuthenticationOptions(
        options,
      );

      await this.prisma.user.update({
        where: { id: user.id },
        data: { currentChallenge: authenticationOptions.challenge },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Authentication options generated',
        data: authenticationOptions,
      };
    } catch (error) {
      console.error('Authentication options error:', error);
      throw error;
    }
  }

  async verifyAuthentication(email: string, response: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { authenticators: true },
      });

      if (!user || !user.currentChallenge) {
        throw new BadRequestException('Invalid authentication state');
      }

      const credential = user.authenticators.find(
        (cred) => cred.credentialId === response.id,
      );

      if (!credential) {
        throw new NotFoundException('Credential not found');
      }

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: credential.credentialId,
          publicKey: credential.credentialPublicKey,
          counter: Number(credential.counter),
        },
      });

      if (verification.verified) {
        // Update counter
        await this.prisma.authenticator.update({
          where: { id: credential.id },
          data: { counter: BigInt(verification.authenticationInfo.newCounter) },
        });

        // Clear challenge
        await this.prisma.user.update({
          where: { id: user.id },
          data: { currentChallenge: null },
        });
        return {
          statusCode: HttpStatus.OK,
          message: 'Verification successful!',
          data: {
            verified: true,
            userId: user.id,
          },
        };
      }
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Verification unsuccessful!',
        data: { verified: false },
      };
    } catch (error) {
      throw error;
    }
  }
}
