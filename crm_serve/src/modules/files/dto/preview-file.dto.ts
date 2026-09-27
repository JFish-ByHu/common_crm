import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class PreviewFileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  fileId!: string
}
