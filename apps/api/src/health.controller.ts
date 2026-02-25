import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { PrismaService } from "./prisma/prisma.service";

@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new HttpException(
        {
          status: "degraded",
          database: "disconnected",
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
