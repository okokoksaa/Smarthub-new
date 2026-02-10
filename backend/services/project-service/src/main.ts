import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstrap the Project Service application
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PROJECT_SERVICE_PORT', 3002);
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
      .setTitle('CDF Smart Hub - Project Service')
      .setDescription('Complete CDF project lifecycle management - planning, budgeting, execution, monitoring')
      .setVersion('1.0')
      .addTag('Projects', 'Project CRUD and lifecycle management')
      .addTag('Milestones', 'Project milestone tracking')
      .addTag('Budget', 'Project budget allocation and tracking')
      .addTag('Approvals', 'Project approval workflows')
      .addTag('Monitoring', 'Project monitoring and evaluation')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
  }

  // Start the application
  await app.listen(port);

  logger.log(`=================================================`);
  logger.log(`🏗️  CDF Smart Hub Project Service`);
  logger.log(`=================================================`);
  logger.log(`Environment: ${environment}`);
  logger.log(`Port: ${port}`);
  logger.log(`API Base URL: http://localhost:${port}/api/v1`);
  logger.log(`Health Check: http://localhost:${port}/api/v1/health`);
  logger.log(`=================================================`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start Project Service', error);
  process.exit(1);
});
