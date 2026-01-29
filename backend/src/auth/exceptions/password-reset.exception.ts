import { BadRequestException } from '@nestjs/common';

export class PasswordResetException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidResetCodeException extends BadRequestException {
  constructor(message = 'Invalid reset code. Please try again.') {
    super(message);
  }
}

export class ExpiredResetCodeException extends BadRequestException {
  constructor(message = 'Reset code has expired. Please request a new one.') {
    super(message);
  }
}

export class InvalidResetTokenException extends BadRequestException {
  constructor(message = 'Invalid or expired reset token.') {
    super(message);
  }
}

export class UserNotFoundException extends BadRequestException {
  constructor(message = 'No account exists with that email address.') {
    super(message);
  }
}
