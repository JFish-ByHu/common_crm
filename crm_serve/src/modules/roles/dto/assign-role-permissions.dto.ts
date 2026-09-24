import { ArrayMaxSize, ArrayUnique, IsArray, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator'
import type { AssignRolePermissionsRequest } from '@common-crm/types/api'

export class AssignRolePermissionsDto implements AssignRolePermissionsRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  roleId!: string

  @IsArray()
  @ArrayMaxSize(3000)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  menuIds!: string[]

  @IsArray()
  @ArrayMaxSize(10000)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  actionIds!: string[]

  @Matches(/^[0-9]{1,20}$/)
  revision!: string
}
