import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstrap the Finance Service application
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('FINANCE_SERVICE_PORT', 3003);
  const environment = configService.get<string>('NODE_ENV', 'development');

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API documentation
  if (environment === 'development') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('CDF Smart Hub - Finance Service')
      .setDescription('Budget allocation and dual-approval payment workflows with zero-tolerance for corruption')
      .setVersion('1.0')
      .addTag('Budget', 'Budget allocation and management')
      .addTag('Payments', 'Payment voucher creation and processing')
      .addTag('Approvals', 'Dual-approval workflow (Panel A + Panel B)')
      .addTag('Reports', 'Financial reports and reconciliation')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
  }

  // Start the application
  await app.listen(port);

  logger.log(`=================================================`);
  logger.log(`💰 CDF Smart Hub Finance Service`);
  logger.log(`=================================================`);
  logger.log(`Environment: ${environment}`);
  logger.log(`Port: ${port}`);
  logger.log(`API Base URL: http://localhost:${port}/api/v1`);
  logger.log(`Health Check: http://localhost:${port}/api/v1/health`);
  logger.log(`=================================================`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start Finance Service', error);
  process.exit(1);
});
