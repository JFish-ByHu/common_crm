import { Transform } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength
} from 'class-validator'

export class UserOnlineStatusQueryDto {
  /** 逗号分隔的用户 ID，去重后最多 100 个。 */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? [...new Set(value.split(',').map(id => id.trim()))] : value
  )
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(64, { each: true })
  userIds!: string[]
}
