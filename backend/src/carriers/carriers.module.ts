import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from '../shipments/entities/shipment.entity';
import { CarriersService } from './carriers.service';
import { CarriersController } from './carriers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment])],
  controllers: [CarriersController],
  providers: [CarriersService],
})
export class CarriersModule {}
