import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { SupabaseService } from '../supabase/supabase.service';
import { ListMessagesQuery } from './dto/list-messages.query';
import { SendMessageDto } from './dto/send-message.dto';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  private async assertIsMember(groupId: string, userId: string): Promise<void> {
    const membership = await this.prisma.group_members.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });
    if (!membership) {
      throw new ForbiddenException('Vous n\'êtes pas membre de ce groupe');
    }
  }

  async listMessages(
    userId: string,
    groupId: string,
    query: ListMessagesQuery,
  ) {
    await this.assertIsMember(groupId, userId);

    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const before = query.before ? new Date(query.before) : undefined;

    const messages = await this.prisma.group_messages.findMany({
      where: {
        group_id: groupId,
        ...(before ? { created_at: { lt: before } } : {}),
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
    });

    const nextCursor =
      messages.length === limit
        ? messages[messages.length - 1].created_at.toISOString()
        : null;

    return { messages, nextCursor };
  }

  async sendMessage(userId: string, groupId: string, dto: SendMessageDto) {
    await this.assertIsMember(groupId, userId);

    const message = await this.prisma.group_messages.create({
      data: {
        group_id: groupId,
        user_id: userId,
        content: dto.content,
      },
      include: {
        user: { select: { id: true, first_name: true, last_name: true, email: true } },
      },
    });

    await this.broadcast(groupId, message);

    return message;
  }

  private async broadcast(groupId: string, payload: unknown): Promise<void> {
    const client = this.supabase.getClient();
    if (!client) {
      this.logger.warn(
        `Supabase client unavailable — message broadcast skipped for group ${groupId}`,
      );
      return;
    }

    try {
      const channel = client.channel(`group:${groupId}`);
      await channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Broadcast failed for group ${groupId}: ${message}`);
    }
  }
}
