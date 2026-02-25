import { IsIn, IsString } from "class-validator";

export class ChangeRoleDto {
  @IsString()
  @IsIn(["owner", "admin", "member"])
  role!: string;
}
