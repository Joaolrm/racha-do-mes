import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'Racha do Mês API',
      version: '1.0',
      description:
        'API para gerenciamento de despesas compartilhadas. ' +
        'Automatiza divisão de valores, registra pagamentos, gera cobranças personalizadas e organiza o histórico.',
      documentation: '/api/docs',
      features: [
        'Autenticação JWT',
        'Cadastro de contas fixas',
        'Registro de pagamentos',
        'Cálculo automático de saldos',
        'Histórico de transações',
        'Geração de mensagens de cobrança',
      ],
    };
  }
}
