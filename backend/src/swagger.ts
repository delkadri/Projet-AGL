import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function generateSwagger() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Projet-AGL API')
    .setDescription('The API documentation for Projet-AGL backend')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('health')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = join(__dirname, '..', 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2), { encoding: 'utf8' });

  await app.close();
}

generateSwagger().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate OpenAPI document', err);
  process.exit(1);
});

