import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health(): { success: boolean } {
    return { success: true };
  }
}
