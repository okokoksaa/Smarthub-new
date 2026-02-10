import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

/**
 * Bootstrap the API Gateway application
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  // Render (and many PaaS providers) provide the listening port via PORT
  const port =
    configService.get<number>('PORT') ?? configService.get<number>('API_GATEWAY_PORT', 3000);
  const environment = configService.get<string>('NODE_ENV', 'development');

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Security middleware
  if (configService.get<string>('HELMET_ENABLED', 'true') === 'true') {
    app.use(helmet());
    logger.log('Helmet security headers enabled');
  }

  // Compression middleware
  app.use(compression());

  // Lightweight request logging scaffold for observability
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`);
    });
    next();
  });

  // CORS configuration
  const corsOrigins = configService
    .get<string>('CORS_ORIGIN', 'http://localhost:8080,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Constituency-ID'],
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
      .setTitle('CDF Smart Hub API')
      .setDescription(
        'API documentation for Zambia Constituency Development Fund Management System',
      )
      .setVersion('1.0')
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Users', 'User management')
      .addTag('Projects', 'CDF project lifecycle management')
      .addTag('Finance', 'Financial operations and payments')
      .addTag('Workflows', 'Workflow orchestration')
      .addTag('Documents', 'Document management')
      .addTag('Notifications', 'Notification delivery')
      .addTag('Reports', 'Reporting and analytics')
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
    const swaggerPath = configService.get<string>('SWAGGER_PATH', 'api/docs');
    SwaggerModule.setup(swaggerPath, app, document, {
      customSiteTitle: 'CDF Smart Hub API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
    });

    logger.log(`Swagger documentation available at: /${swaggerPath}`);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  // Start the application
  await app.listen(port);

  logger.log(`=================================================`);
  logger.log(`🚀 CDF Smart Hub API Gateway`);
  logger.log(`=================================================`);
  logger.log(`Environment: ${environment}`);
  logger.log(`Port: ${port}`);
  logger.log(`API Base URL: http://localhost:${port}/api/v1`);
  logger.log(`Health Check: http://localhost:${port}/api/v1/health`);
  if (configService.get<string>('SWAGGER_ENABLED', 'true') === 'true') {
    logger.log(
      `API Docs: http://localhost:${port}/${configService.get<string>('SWAGGER_PATH', 'api/docs')}`,
    );
  }
  logger.log(`=================================================`);
}

// Start the application
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error);
  process.exit(1);
});
