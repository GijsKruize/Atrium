import { IsString, IsOptional, IsArray, MaxLength } from "class-validator";
import { PaginationQueryDto } from "../common";

export class CreateProjectDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  clientUserIds?: string[];
}

export class ClientProjectListQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  search?: string;
}

export class ProjectListQueryDto extends ClientProjectListQueryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  archived?: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  clientUserIds?: string[];
}
