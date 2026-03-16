import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;
    const client = this.supabaseService.getClient();

    if (!client) {
      throw new BadRequestException('Supabase client not initialized');
    }

    const { data, error } = await client.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Créer l'utilisateur dans Prisma
    if (data.user) {
      await this.prisma.users.create({
        data: {
          id: data.user.id,
          email: data.user.email!,
        },
      });
    }

    return {
      user: {
        id: data.user?.id,
        email: data.user?.email,
        email_confirmed_at: data.user?.email_confirmed_at,
        last_sign_in_at: data.user?.last_sign_in_at,
      },
      session: data.session
        ? {
            access_token: data.session.access_token,
            token_type: data.session.token_type,
            expires_in: data.session.expires_in,
            expires_at: data.session.expires_at,
          }
        : undefined,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const client = this.supabaseService.getClient();

    if (!client) {
      throw new BadRequestException('Supabase client not initialized');
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      user: {
        id: data.user?.id,
        email: data.user?.email,
        email_confirmed_at: data.user?.email_confirmed_at,
        last_sign_in_at: data.user?.last_sign_in_at,
      },
      session: data.session
        ? {
            access_token: data.session.access_token,
            token_type: data.session.token_type,
            expires_in: data.session.expires_in,
            expires_at: data.session.expires_at,
          }
        : undefined,
    };
  }

  async getCurrentUser(
    authUserId: string,
    authUserEmail: string | null | undefined,
  ) {
    if (!authUserId || typeof authUserId !== 'string') {
      throw new UnauthorizedException('Invalid token: user id required');
    }
    const email = authUserEmail?.trim() || null;
    if (!email) {
      throw new BadRequestException(
        'User email is required (missing in auth token)',
      );
    }

    try {
      // Obtenir l'utilisateur de la base de données Prisma
      let user = await this.prisma.users.findUnique({
        where: { id: authUserId },
        include: { parcours: true },
      });

      // S'il n'existe pas (ex: utilisateur créé via une autre interface avant Prisma), on le crée
      if (!user) {
        user = await this.prisma.users.create({
          data: {
            id: authUserId,
            email,
          },
          include: { parcours: true },
        });
      }

      // Trouver le niveau en fonction des feuilles (la table levels peut être vide)
      let level: { level_number: number } | null = null;
      try {
        level = await this.prisma.levels.findFirst({
          where: {
            required_feuilles: {
              lte: user.feuilles,
            },
          },
          orderBy: {
            required_feuilles: 'desc',
          },
        });
      } catch (levelError) {
        this.logger.warn(
          'Levels query failed (table may be missing or empty)',
          levelError,
        );
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        feuilles: user.feuilles,
        niveau: level ? level.level_number : 1,
        onboardingCompleted: user.onboarding_completed,
        parcours: user.parcours,
      };
    } catch (error) {
      this.logger.error('getCurrentUser failed', error);
      throw error;
    }
  }
}
