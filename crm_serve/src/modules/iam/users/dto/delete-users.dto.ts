import { Transform } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength
} from 'class-validator'
import { trimUserIds } from './transforms'

export class DeleteUsersDto {
  /** 1 至 1000 个不重复的用户 ID，全部存在时才执行删除。 */
  @Transform(trimUserIds)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(1000)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(64, { each: true })
  userIds!: string[]
}
