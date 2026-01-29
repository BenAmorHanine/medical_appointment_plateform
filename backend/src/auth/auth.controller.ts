import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { AuthService } from './auth.service';
import { PasswordResetService } from './services/password-reset.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetVerifyDto } from './dto/password-reset-verify.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  /**
   * User login endpoint
   * Returns JWT access token and user details
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      properties: {
        access_token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['doctor', 'patient', 'admin'] },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid credentials' })
  @ApiInternalServerErrorResponse({ description: 'Server error' })
  async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<any> {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );
      return this.authService.login(user);
    } catch (error) {
      this.logger.error(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * User registration endpoint
   * Creates new user and returns JWT token
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      properties: {
        access_token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['doctor', 'patient', 'admin'] },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input or user already exists' })
  @ApiInternalServerErrorResponse({ description: 'Server error' })
  async register(@Body(ValidationPipe) registerDto: RegisterDto): Promise<any> {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      this.logger.error(`Registration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get current user profile
   * Requires JWT authentication
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile')
  @Roles('doctor', 'patient', 'admin')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getProfile(@GetUser() user: any) {
    return user;
  }

  /**
   * Request password reset code - sends 6-digit code to user email
   */
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset code' })
  @ApiBody({ type: PasswordResetRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Reset code sent to email',
    schema: { properties: { message: { type: 'string' } } },
  })
  @ApiBadRequestResponse({ description: 'Invalid email format' })
  @ApiInternalServerErrorResponse({ description: 'Email sending failed' })
  async requestPasswordReset(
    @Body(ValidationPipe) dto: PasswordResetRequestDto,
  ): Promise<any> {
    try {
      return await this.passwordResetService.requestPasswordReset(dto.email);
    } catch (error) {
      this.logger.error(`Password reset request error: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }

  /**
   * Verify password reset code - validates 6-digit code and returns temporary JWT token
   */
  @Post('password-reset/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify reset code and get temporary token' })
  @ApiBody({ type: PasswordResetVerifyDto })
  @ApiResponse({
    status: 200,
    description: 'Code verified successfully',
    schema: { properties: { token: { type: 'string' } } },
  })
  @ApiBadRequestResponse({ description: 'Invalid or expired code' })
  @ApiInternalServerErrorResponse({ description: 'Server error' })
  async verifyResetCode(
    @Body(ValidationPipe) dto: PasswordResetVerifyDto,
  ): Promise<any> {
    try {
      return await this.passwordResetService.verifyResetCode(dto.email, dto.code);
    } catch (error) {
      this.logger.error(`Verify reset code error: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }

  /**
   * Confirm password reset - requires temporary token from verification step
   */
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with temporary token' })
  @ApiBody({ type: PasswordResetConfirmDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: { properties: { message: { type: 'string' } } },
  })
  @ApiBadRequestResponse({ description: 'Invalid token or password requirements not met' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @ApiInternalServerErrorResponse({ description: 'Server error' })
  async resetPassword(
    @Body(ValidationPipe) dto: PasswordResetConfirmDto,
  ): Promise<any> {
    try {
      return await this.passwordResetService.confirmPasswordReset(dto.token, dto.password);
    } catch (error) {
      this.logger.error(`Reset password error: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }
}