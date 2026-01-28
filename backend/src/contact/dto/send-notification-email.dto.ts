import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SendNotificationEmailDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsEmail() recipientEmail: string;
  @IsNotEmpty() @IsString() subject: string;
  @IsNotEmpty() @IsString() message: string;
  @IsOptional() @IsString() role?: string;
}