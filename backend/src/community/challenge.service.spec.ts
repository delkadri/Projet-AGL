import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'nestjs-prisma';
import { ChallengeService } from './challenge.service';

const mockPrisma = {
  groups: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  challenges: {
    findMany: jest.fn(),
  },
  group_challenges: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  group_challenge_completions: {
    findUnique: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  group_members: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  users: {
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

describe('ChallengeService', () => {
  let service: ChallengeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ChallengeService>(ChallengeService);
  });

  afterEach(() => jest.clearAllMocks());

  // ──────────────────────────────────────────────
  // assignWeeklyChallengeToGroup
  // ──────────────────────────────────────────────
  describe('assignWeeklyChallengeToGroup', () => {
    it('throws NotFoundException when group does not exist', async () => {
      mockPrisma.groups.findUnique.mockResolvedValue(null);

      await expect(
        service.assignWeeklyChallengeToGroup('missing-group'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when no challenges exist', async () => {
      mockPrisma.groups.findUnique.mockResolvedValue({ id: 'g1' });
      mockPrisma.group_challenges.findMany.mockResolvedValue([]);
      mockPrisma.challenges.findMany.mockResolvedValue([]);

      await expect(service.assignWeeklyChallengeToGroup('g1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates a GroupChallenge with a non-recently-used challenge', async () => {
      mockPrisma.groups.findUnique.mockResolvedValue({ id: 'g1' });
      mockPrisma.group_challenges.findMany.mockResolvedValue([
        { challenge_id: 'c-old' },
      ]);
      const freshChallenge = { id: 'c-new', title: 'Eco défi' };
      mockPrisma.challenges.findMany.mockResolvedValue([freshChallenge]);
      const created = {
        id: 'gc-1',
        group_id: 'g1',
        challenge_id: 'c-new',
      };
      mockPrisma.group_challenges.create.mockResolvedValue(created);

      const result = await service.assignWeeklyChallengeToGroup('g1');

      expect(mockPrisma.group_challenges.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            group_id: 'g1',
            challenge_id: 'c-new',
          }),
        }),
      );
      expect(result).toEqual(created);
    });

    it('falls back to any challenge when all have been recently used', async () => {
      mockPrisma.groups.findUnique.mockResolvedValue({ id: 'g1' });
      mockPrisma.group_challenges.findMany.mockResolvedValue([
        { challenge_id: 'c1' },
      ]);
      // First call (notIn filter) returns empty, second call (no filter) returns c1
      mockPrisma.challenges.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'c1', title: 'Old défi' }]);
      mockPrisma.group_challenges.create.mockResolvedValue({
        id: 'gc-1',
        challenge_id: 'c1',
      });

      await service.assignWeeklyChallengeToGroup('g1');

      expect(mockPrisma.group_challenges.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ challenge_id: 'c1' }),
        }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // completeGroupChallenge
  // ──────────────────────────────────────────────
  describe('completeGroupChallenge', () => {
    const groupChallenge = { id: 'gc-1', group_id: 'g1' };
    const membership = { id: 'mem-1', group_id: 'g1', user_id: 'u1' };

    it('throws NotFoundException when group challenge not found', async () => {
      mockPrisma.group_challenges.findUnique.mockResolvedValue(null);

      await expect(
        service.completeGroupChallenge('u1', 'gc-missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when user is not a member', async () => {
      mockPrisma.group_challenges.findUnique.mockResolvedValue(groupChallenge);
      mockPrisma.group_members.findUnique.mockResolvedValue(null);

      await expect(
        service.completeGroupChallenge('u1', 'gc-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when already completed', async () => {
      mockPrisma.group_challenges.findUnique.mockResolvedValue(groupChallenge);
      mockPrisma.group_members.findUnique.mockResolvedValue(membership);
      mockPrisma.group_challenge_completions.findUnique.mockResolvedValue({
        id: 'comp-1',
      });

      await expect(
        service.completeGroupChallenge('u1', 'gc-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('credits feuilles and arbres and returns completion', async () => {
      mockPrisma.group_challenges.findUnique.mockResolvedValue(groupChallenge);
      mockPrisma.group_members.findUnique.mockResolvedValue(membership);
      mockPrisma.group_challenge_completions.findUnique.mockResolvedValue(null);
      const comp = { id: 'comp-1', user_id: 'u1', group_challenge_id: 'gc-1' };
      mockPrisma.group_challenge_completions.create.mockResolvedValue(comp);
      mockPrisma.users.update.mockResolvedValue({});
      mockPrisma.group_members.update.mockResolvedValue({});
      mockPrisma.group_members.count.mockResolvedValue(3);
      mockPrisma.group_challenge_completions.count.mockResolvedValue(1);

      const result = await service.completeGroupChallenge('u1', 'gc-1');

      expect(mockPrisma.users.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { feuilles: { increment: 20 } },
      });
      expect(mockPrisma.group_members.update).toHaveBeenCalledWith({
        where: { group_id_user_id: { group_id: 'g1', user_id: 'u1' } },
        data: { arbres: { increment: 1 } },
      });
      expect(result).toEqual(comp);
    });

    it('calls awardGroupBonus when all members have completed', async () => {
      mockPrisma.group_challenges.findUnique.mockResolvedValue(groupChallenge);
      mockPrisma.group_members.findUnique.mockResolvedValue(membership);
      mockPrisma.group_challenge_completions.findUnique.mockResolvedValue(null);
      mockPrisma.group_challenge_completions.create.mockResolvedValue({
        id: 'comp-1',
      });
      mockPrisma.users.update.mockResolvedValue({});
      mockPrisma.group_members.update.mockResolvedValue({});
      mockPrisma.group_members.count.mockResolvedValue(2);
      mockPrisma.group_challenge_completions.count.mockResolvedValue(2);
      mockPrisma.group_members.findMany.mockResolvedValue([
        { user_id: 'u1' },
        { user_id: 'u2' },
      ]);
      mockPrisma.users.updateMany.mockResolvedValue({});
      mockPrisma.groups.update.mockResolvedValue({});

      await service.completeGroupChallenge('u1', 'gc-1');

      expect(mockPrisma.groups.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ win_streak: { increment: 1 } }),
        }),
      );
    });

    it('does NOT call awardGroupBonus when some members remain', async () => {
      mockPrisma.group_challenges.findUnique.mockResolvedValue(groupChallenge);
      mockPrisma.group_members.findUnique.mockResolvedValue(membership);
      mockPrisma.group_challenge_completions.findUnique.mockResolvedValue(null);
      mockPrisma.group_challenge_completions.create.mockResolvedValue({
        id: 'comp-1',
      });
      mockPrisma.users.update.mockResolvedValue({});
      mockPrisma.group_members.update.mockResolvedValue({});
      mockPrisma.group_members.count.mockResolvedValue(3);
      mockPrisma.group_challenge_completions.count.mockResolvedValue(1);

      await service.completeGroupChallenge('u1', 'gc-1');

      expect(mockPrisma.groups.update).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // awardGroupBonus
  // ──────────────────────────────────────────────
  describe('awardGroupBonus', () => {
    it('increments win_streak and credits GROUP_BONUS_FEUILLES to all members', async () => {
      mockPrisma.group_members.findMany.mockResolvedValue([
        { user_id: 'u1' },
        { user_id: 'u2' },
      ]);
      mockPrisma.users.updateMany.mockResolvedValue({});
      mockPrisma.groups.update.mockResolvedValue({});

      await service.awardGroupBonus('g1');

      expect(mockPrisma.users.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['u1', 'u2'] } },
        data: { feuilles: { increment: 50 } },
      });
      expect(mockPrisma.groups.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'g1' },
          data: expect.objectContaining({
            win_streak: { increment: 1 },
          }),
        }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // resetGroupStreak
  // ──────────────────────────────────────────────
  describe('resetGroupStreak', () => {
    it('resets streak to 0 when no challenge exists for this week', async () => {
      mockPrisma.group_challenges.findFirst.mockResolvedValue(null);
      mockPrisma.groups.update.mockResolvedValue({});

      await service.resetGroupStreak('g1');

      expect(mockPrisma.groups.update).toHaveBeenCalledWith({
        where: { id: 'g1' },
        data: { win_streak: 0 },
      });
    });

    it('resets streak to 0 when completions < member count', async () => {
      mockPrisma.group_challenges.findFirst.mockResolvedValue({ id: 'gc-1' });
      mockPrisma.group_members.count.mockResolvedValue(3);
      mockPrisma.group_challenge_completions.count.mockResolvedValue(2);
      mockPrisma.groups.update.mockResolvedValue({});

      await service.resetGroupStreak('g1');

      expect(mockPrisma.groups.update).toHaveBeenCalledWith({
        where: { id: 'g1' },
        data: { win_streak: 0 },
      });
    });

    it('does NOT reset streak when all members completed', async () => {
      mockPrisma.group_challenges.findFirst.mockResolvedValue({ id: 'gc-1' });
      mockPrisma.group_members.count.mockResolvedValue(3);
      mockPrisma.group_challenge_completions.count.mockResolvedValue(3);
      mockPrisma.groups.update.mockResolvedValue({});

      await service.resetGroupStreak('g1');

      expect(mockPrisma.groups.update).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // resetGroupRankings
  // ──────────────────────────────────────────────
  describe('resetGroupRankings', () => {
    it('resets arbres to 0 for all group members', async () => {
      mockPrisma.group_members.updateMany.mockResolvedValue({ count: 12 });

      await service.resetGroupRankings();

      expect(mockPrisma.group_members.updateMany).toHaveBeenCalledWith({
        data: { arbres: 0 },
      });
    });
  });
});
