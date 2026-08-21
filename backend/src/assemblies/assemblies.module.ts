import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { AssembliesController } from './assemblies.controller';
import { AssembliesService } from './assemblies.service';
@Module({
  imports: [AuthModule],
  controllers: [AssembliesController],
  providers: [AssembliesService],
  exports: [AssembliesService],
})
export class AssembliesModule {}
