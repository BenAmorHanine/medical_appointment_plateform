// src/profile/profile.controller.ts
import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getMyProfile(@Req() req) {
    return this.profileService.getProfile(req.user.id, req.user.role);
  }

  @Patch()
  async updateMyProfile(@Req() req, @Body() updateDto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id, req.user.role, updateDto);
  }
}