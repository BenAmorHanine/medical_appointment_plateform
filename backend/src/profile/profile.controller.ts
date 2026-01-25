import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getMyProfile(@Req() req) {
    // req.user.id comme dans validate de jwt.strategy.ts
    return this.profileService.getProfile(req.user.id, req.user.role);
  }

  /*@Patch()
  async updateMyProfile(@Req() req, @Body() updateDto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id, req.user.role, updateDto);
  }*/
 // UPDATED: add the image upload
  @Patch()
  @UseInterceptors(
  FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/doctors',
      filename: (_, file, cb) => {
        const unique =
          Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + extname(file.originalname));
      },
    }),
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only images allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 2 * 1024 * 1024 },
  }),
)
  async updateMyProfile(@Req() req, @Body() updateDto: UpdateProfileDto, @UploadedFile() file?: Express.Multer.File,) {
    return this.profileService.updateProfileWithImage(req.user.id, req.user.role, updateDto, file,);
  }
}