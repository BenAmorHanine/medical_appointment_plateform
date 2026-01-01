import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth, 
  ApiForbiddenResponse,
  ApiUnauthorizedResponse 
} from '@nestjs/swagger'; 
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()  
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard statistics (ADMIN ONLY)' })
  @ApiUnauthorizedResponse({ description: 'Invalid JWT' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  getStats() {
    return this.dashboardService.getStats();
  }
}
