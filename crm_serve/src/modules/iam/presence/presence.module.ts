import { Module } from '@nestjs/common'
import { RedisModule } from '../../../redis'
import { PresenceService } from './presence.service'

@Module({
  imports: [RedisModule],
  providers: [PresenceService],
  exports: [PresenceService]
})
export class PresenceModule {}
