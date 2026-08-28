import { INestApplication, ValidationPipe } from '@nestjs/common';
import { isValidationErrorDetailEnabled } from './bootstrap-security';

/** Apply the HTTP prefix and DTO validation contract shared by production and e2e applications. */
export function applyGlobalValidation(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: false, // Always show detailed validation errors
    }),
  );
}
