import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectListQueryDto,
  ClientProjectListQueryDto,
} from "./projects.dto";
import {
  AuthGuard,
  RolesGuard,
  Roles,
  CurrentOrg,
  CurrentUser,
} from "../common";

@Controller("projects")
@UseGuards(AuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  @Roles("owner", "admin")
  findAll(
    @Query() query: ProjectListQueryDto,
    @CurrentOrg("id") orgId: string,
  ) {
    return this.projectsService.findAll(orgId, query);
  }

  @Get("mine")
  findMine(
    @CurrentUser("id") userId: string,
    @CurrentOrg("id") orgId: string,
    @Query() query: ClientProjectListQueryDto,
  ) {
    return this.projectsService.findByClient(userId, orgId, query);
  }

  @Get("mine/:id")
  findOneMine(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @CurrentOrg("id") orgId: string,
  ) {
    return this.projectsService.findOneByClient(id, userId, orgId);
  }

  @Get("stats")
  @Roles("owner", "admin")
  getStats(@CurrentOrg("id") orgId: string) {
    return this.projectsService.getStats(orgId);
  }

  @Get("statuses")
  getStatuses(@CurrentOrg("id") orgId: string) {
    return this.projectsService.getStatuses(orgId);
  }

  @Get(":id")
  @Roles("owner", "admin")
  findOne(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.projectsService.findOne(id, orgId);
  }

  @Post()
  @Roles("owner", "admin")
  create(@Body() dto: CreateProjectDto, @CurrentOrg("id") orgId: string) {
    return this.projectsService.create(dto, orgId);
  }

  @Post(":id/archive")
  @Roles("owner", "admin")
  archive(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.projectsService.archive(id, orgId);
  }

  @Post(":id/unarchive")
  @Roles("owner", "admin")
  unarchive(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.projectsService.unarchive(id, orgId);
  }

  @Put(":id")
  @Roles("owner", "admin")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentOrg("id") orgId: string,
  ) {
    return this.projectsService.update(id, dto, orgId);
  }

  @Delete(":id")
  @Roles("owner", "admin")
  remove(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.projectsService.remove(id, orgId);
  }
}
