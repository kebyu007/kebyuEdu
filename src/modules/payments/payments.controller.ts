import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('payments', 'create')
  @ApiOperation({ summary: "O'quvchi to'lovini kiritish (Faqat Admin)" })
  create(@Body() dto: CreatePaymentDto, @Req() req: any) {
    return this.paymentsService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('payments', 'read')
  @ApiOperation({ summary: "Barcha to'lovlar tarixini ko'rish (Faqat Admin)" })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('my-payments')
  @ApiOperation({ summary: "O'quvchi o'zining to'lovlar tarixini ko'rishi" })
  findMyPayments(@Req() req: any) {
    // Har qanday tizimga kirgan user o'z to'lovini ko'ra oladi (Permission shart emas, JwtAuthGuard o'zi yetarli)
    return this.paymentsService.findMyPayments(req.user.id);
  }

  @Post('charge')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('payments', 'create')
  @ApiOperation({ summary: "O'quvchidan oylik to'lovni yechish (Qarz yozish)" })
  chargeStudent(
    @Req() req: any,
    @Body() body: { student_id: number; amount: number; month: string; comment?: string },
  ) {
    return this.paymentsService.chargeStudent(
      req.user.id,
      body.student_id,
      body.amount,
      body.month,
      body.comment,
    );
  }
}
