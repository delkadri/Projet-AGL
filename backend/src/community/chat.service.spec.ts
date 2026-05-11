import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'nestjs-prisma';
import { SupabaseService } from '../supabase/supabase.service';
import { ChatService } from './chat.service';

const mockPrisma = {
  group_members: { findUnique: jest.fn() },
  group_messages: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

const mockChannel = { send: jest.fn() };
const mockClient = { channel: jest.fn().mockReturnValue(mockChannel) };
const mockSupabase = { getClient: jest.fn() };

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SupabaseService, useValue: mockSupabase },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    mockSupabase.getClient.mockReturnValue(mockClient);
    mockChannel.send.mockResolvedValue(undefined);
  });

  afterEach(() => jest.clearAllMocks());

  describe('listMessages', () => {
    it('throws ForbiddenException when user is not a member', async () => {
      mockPrisma.group_members.findUnique.mockResolvedValue(null);

      await expect(
        service.listMessages('user-1', 'group-1', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('applies limit and before cursor', async () => {
      mockPrisma.group_members.findUnique.mockResolvedValue({ id: 'm-1' });
      mockPrisma.group_messages.findMany.mockResolvedValue([]);

      await service.listMessages('user-1', 'group-1', {
        limit: 10,
        before: '2026-05-11T00:00:00.000Z',
      });

      expect(mockPrisma.group_messages.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          where: expect.objectContaining({
            group_id: 'group-1',
            created_at: { lt: new Date('2026-05-11T00:00:00.000Z') },
          }),
          orderBy: { created_at: 'desc' },
        }),
      );
    });

    it('returns nextCursor when the page is full', async () => {
      mockPrisma.group_members.findUnique.mockResolvedValue({ id: 'm-1' });
      const last = new Date('2026-05-10T10:00:00.000Z');
      mockPrisma.group_messages.findMany.mockResolvedValue([
        { id: 'a', created_at: new Date('2026-05-10T11:00:00.000Z') },
        { id: 'b', created_at: last },
      ]);

      const result = await service.listMessages('user-1', 'group-1', {
        limit: 2,
      });

      expect(result.nextCursor).toBe(last.toISOString());
    });

    it('returns null nextCursor when page is not full', async () => {
      mockPrisma.group_members.findUnique.mockResolvedValue({ id: 'm-1' });
      mockPrisma.group_messages.findMany.mockResolvedValue([
        { id: 'a', created_at: new Date() },
      ]);

      const result = await service.listMessages('user-1', 'group-1', {
        limit: 50,
      });

      expect(result.nextCursor).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('throws ForbiddenException when user is not a member', async () => {
      mockPrisma.group_members.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage('user-1', 'group-1', { content: 'hi' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('persists the message and broadcasts on the group channel', async () => {
      mockPrisma.group_members.findUnique.mockResolvedValue({ id: 'm-1' });
      const persisted = {
        id: 'msg-1',
        group_id: 'group-1',
        user_id: 'user-1',
        content: 'hi',
      };
      mockPrisma.group_messages.create.mockResolvedValue(persisted);

      const result = await service.sendMessage('user-1', 'group-1', {
        content: 'hi',
      });

      expect(result).toBe(persisted);
      expect(mockClient.channel).toHaveBeenCalledWith('group:group-1');
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'new_message',
        payload: persisted,
      });
    });

    it('does not throw when supabase client is null', async () => {
      mockPrisma.group_members.findUnique.mockResolvedValue({ id: 'm-1' });
      mockPrisma.group_messages.create.mockResolvedValue({ id: 'msg-1' });
      mockSupabase.getClient.mockReturnValue(null);

      await expect(
        service.sendMessage('user-1', 'group-1', { content: 'hi' }),
      ).resolves.toEqual({ id: 'msg-1' });
      expect(mockChannel.send).not.toHaveBeenCalled();
    });

    it('does not throw when broadcast fails', async () => {
      mockPrisma.group_members.findUnique.mockResolvedValue({ id: 'm-1' });
      mockPrisma.group_messages.create.mockResolvedValue({ id: 'msg-1' });
      mockChannel.send.mockRejectedValue(new Error('boom'));

      await expect(
        service.sendMessage('user-1', 'group-1', { content: 'hi' }),
      ).resolves.toEqual({ id: 'msg-1' });
    });
  });
});
