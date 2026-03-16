import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'nestjs-prisma';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { QuizModule } from './quiz/quiz.module';

import { SeedModule } from './seed/seed.module';
import { UserModule } from './user/user.module';
import { ParcoursModule } from './parcours/parcours.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    SupabaseModule,
    AuthModule,
    QuizModule,
    SeedModule,
    UserModule,
    ParcoursModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
