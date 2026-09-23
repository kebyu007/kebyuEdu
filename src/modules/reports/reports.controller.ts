import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Reports (Dashboard)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @RequirePermissions('reports', 'read')
  @ApiOperation({ summary: 'Umumiy hisobot va statistikani olish' })
  @ApiQuery({
    name: 'month',
    required: false,
    example: '2023-10',
    description:
      'Qaysi oy uchun statistika kerak (Yuborilmasa hozirgi oyni oladi)',
  })
  getDashboardStats(@Query('month') month?: string) {
    return this.reportsService.getDashboardStats(month);
  }
}
