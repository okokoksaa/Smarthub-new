import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstrap the WDC Service application
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('WDC_SERVICE_PORT', 3010);
  const environment = configService.get<string>('NODE_ENV', 'development');

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // CORS configuration
  const corsOrigins = configService
    .get<string>('CORS_ORIGIN', 'http://localhost:3000,http://localhost:8080')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Ward-ID'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  });
  logger.log(`CORS enabled for origins: ${corsOrigins.join(', ')}`);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: environment === 'production',
    }),
  );

  // Swagger API documentation
  if (configService.get<string>('SWAGGER_ENABLED', 'true') === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('CDF Smart Hub - WDC Service API')
      .setDescription(
        'Ward Development Committee (WDC) Service API for managing applications, meetings, and community engagement',
      )
      .setVersion('1.0')
      .addTag('WDC Applications', 'Ward project application management')
      .addTag('WDC Meetings', 'Ward meeting scheduling and management')
      .addTag('WDC Minutes', 'Meeting minutes upload and approval')
      .addTag('Community Polls', 'Community engagement and polling')
      .addTag('Health', 'Service health checks')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const swaggerPath = 'api/docs';
    SwaggerModule.setup(swaggerPath, app, document, {
      customSiteTitle: 'WDC Service API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
    });

    logger.log(`Swagger documentation available at: /${swaggerPath}`);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  // Start the application
  await app.listen(port);

  logger.log(`=================================================`);
  logger.log(`🏛️  CDF Smart Hub - WDC Service`);
  logger.log(`=================================================`);
  logger.log(`Environment: ${environment}`);
  logger.log(`Port: ${port}`);
  logger.log(`API Base URL: http://localhost:${port}/api/v1`);
  logger.log(`Health Check: http://localhost:${port}/api/v1/health`);
  if (configService.get<string>('SWAGGER_ENABLED', 'true') === 'true') {
    logger.log(`API Docs: http://localhost:${port}/api/docs`);
  }
  logger.log(`=================================================`);
}

// Start the application
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start WDC Service', error);
  process.exit(1);
});