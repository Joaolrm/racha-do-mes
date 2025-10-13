import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  // Configurar ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Racha do Mês API')
    .setDescription(
      'API para gerenciamento de despesas compartilhadas. ' +
        'Permite criar contas, registrar pagamentos, calcular saldos e gerar cobranças automatizadas.',
    )
    .setVersion('1.0')
    .addTag('Autenticação', 'Endpoints de registro e login')
    .addTag('Usuários', 'Gerenciamento de usuários')
    .addTag('Contas', 'Gerenciamento de contas fixas e recorrentes')
    .addTag('Pagamentos', 'Registro e consulta de pagamentos')
    .addTag(
      'Saldos e Histórico',
      'Consulta de saldos e histórico de transações',
    )
    .addBearerAuth()
    .addServer(process.env.API_URL || 'http://localhost:3000', 'Servidor Local')
    .setContact(
      'João Luís Rosa de Moura',
      'https://github.com/Joaolrm',
      'jlluismr86@gmail.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Racha do Mês API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
  console.log(
    `📚 Documentação Swagger disponível em: http://localhost:${port}/api/docs`,
  );
}
bootstrap();
