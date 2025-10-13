import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('Informações da API')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Informações da API',
    description: 'Retorna informações básicas sobre a API',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações da API',
    schema: {
      example: {
        name: 'Racha do Mês API',
        version: '1.0',
        description: 'API para gerenciamento de despesas compartilhadas',
        documentation: '/api/docs',
      },
    },
  })
  getInfo() {
    return this.appService.getInfo();
  }

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Verifica se a API está funcionando',
  })
  @ApiResponse({
    status: 200,
    description: 'API está funcionando',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2025-10-11T18:00:00.000Z',
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
