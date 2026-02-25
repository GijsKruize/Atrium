import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import {
  AuthGuard,
  RolesGuard,
  Roles,
  CurrentOrg,
  CurrentUser,
  CurrentMember,
  PaginationQueryDto,
  paginatedResponse,
} from "../common";
import { ClientsService } from "./clients.service";
import { ChangeRoleDto } from "./clients.dto";

@Controller("clients")
@UseGuards(AuthGuard, RolesGuard)
export class ClientsController {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private clientsService: ClientsService,
  ) {}

  @Get()
  @Roles("owner", "admin")
  async list(
    @CurrentOrg("id") orgId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const { page = 1, limit = 20 } = query;
    const where = { organizationId: orgId };
    const [data, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        select: {
          id: true,
          userId: true,
          role: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.member.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  @Get("invitations")
  @Roles("owner", "admin")
  async invitations(@CurrentOrg("id") orgId: string) {
    const webUrl = this.config.get("WEB_URL", "http://localhost:3000");
    const invitations = await this.prisma.invitation.findMany({
      where: { organizationId: orgId, status: "pending" },
      orderBy: { createdAt: "desc" },
    });
    return invitations.map((inv) => ({
      ...inv,
      inviteLink: `${webUrl}/accept-invite?id=${inv.id}`,
    }));
  }

  @Delete(":id")
  @Roles("owner", "admin")
  async remove(
    @Param("id") memberId: string,
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @CurrentMember("role") role: string,
  ) {
    await this.clientsService.removeMember(memberId, orgId, userId, role);
  }

  @Put(":id/role")
  @Roles("owner")
  async changeRole(
    @Param("id") memberId: string,
    @Body() dto: ChangeRoleDto,
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.clientsService.changeRole(memberId, dto.role, orgId, userId);
  }
}
