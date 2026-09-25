import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested
} from 'class-validator'
import type {
  ApiPermissionRule,
  MenuActionInput,
  MenuInput,
  MenuType,
  PermissionHttpMethod
} from '@common-crm/types/api'
import { trimString } from '../../../common'

export class MenuIdDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  menuId!: string
}

export class MenuInputDto implements MenuInput {
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  parentId!: string | null

  @IsIn(['DIRECTORY', 'PAGE'])
  menuType!: MenuType

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name!: string

  @Transform(trimString)
  @Matches(/^[a-zA-Z][a-zA-Z0-9:_.-]{0,127}$/)
  permissionCode!: string

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : (value ?? null)))
  @ValidateIf((_object, value) => value !== null)
  @Matches(/^(?:\/(?:[a-zA-Z0-9_-]+|:[a-zA-Z][a-zA-Z0-9_]*))+$/)
  @MaxLength(255)
  routePath: string | null = null

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : (value ?? null)))
  @ValidateIf((_object, value) => value !== null)
  @Matches(/^[a-z][a-z0-9-]{0,127}$/)
  componentKey: string | null = null

  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(64)
  icon!: string | null

  @IsInt()
  @Min(0)
  @Max(99999)
  sortOrder!: number

  @IsBoolean()
  visible!: boolean

  @IsBoolean()
  enabled!: boolean
}

export class UpdateMenuDto extends MenuInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  menuId!: string
}

export class DeleteMenusDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  menuIds!: string[]
}

export class ApiRuleDto implements ApiPermissionRule {
  @IsIn(['GET', 'POST', 'PATCH', 'DELETE', 'PUT'])
  httpMethod!: PermissionHttpMethod

  @IsString()
  @Matches(/^\/[a-zA-Z0-9/:_-]+$/)
  @MaxLength(255)
  path!: string
}

export class MenuActionDto implements MenuActionInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  menuId!: string

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name!: string

  @Transform(trimString)
  @Matches(/^[a-zA-Z][a-zA-Z0-9:_.-]{0,127}$/)
  permissionCode!: string

  @IsInt()
  @Min(0)
  @Max(99999)
  sortOrder!: number

  @IsBoolean()
  enabled!: boolean

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ApiRuleDto)
  rules!: ApiRuleDto[]
}

export class ActionIdDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  actionId!: string
}

export class UpdateMenuActionDto extends MenuActionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  actionId!: string
}
