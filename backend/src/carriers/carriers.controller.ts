import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CarriersService } from './carriers.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('carriers')
@ApiBearerAuth()
@Controller('carriers')
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  @Get('me/metrics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CARRIER)
  @ApiOperation({ summary: 'Get performance metrics for the authenticated carrier' })
  getMyMetrics(@CurrentUser() user: User) {
    return this.carriersService.getMyMetrics(user.id);
  }
}
