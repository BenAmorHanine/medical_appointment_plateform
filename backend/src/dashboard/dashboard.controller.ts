import {
  Controller,
  Get,
  Patch,      
  Delete,     
  Param,      
  Body,       
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
  @Get('users')
@ApiOperation({ summary: 'Get all users list (ADMIN ONLY)' })
@ApiForbiddenResponse({ description: 'Admin role required' })
getAllUsers() {
  return this.dashboardService.getAllUsers();
}

// 🔥 NOUVEAU : Changer rôle user
@Patch('users/:id/role')
@ApiOperation({ summary: 'Change user role (ADMIN ONLY)' })
@ApiForbiddenResponse({ description: 'Admin role required' })
changeUserRole(
  @Param('id') userId: string, 
  @Body() body: { role: string }
) {
  return this.dashboardService.changeUserRole(userId, body.role);
}

// 🔥 NOUVEAU : Supprimer user
@Delete('users/:id')
@ApiOperation({ summary: 'Delete user (ADMIN ONLY)' })
@ApiForbiddenResponse({ description: 'Admin role required' })
deleteUser(@Param('id') userId: string) {
  return this.dashboardService.deleteUser(userId);
}
}
