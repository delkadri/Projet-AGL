import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'nestjs-prisma';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupService } from './group.service';

const mockPrisma = {
  users: { findUnique: jest.fn() },
  levels: { findFirst: jest.fn() },
  groups: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  group_members: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

describe('GroupService', () => {
  let service: GroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
  });

  afterEach(() => jest.clearAllMocks());

  // ──────────────────────────────────────────────
  // createGroup
  // ──────────────────────────────────────────────
  describe('createGroup', () => {
    const dto: CreateGroupDto = {
      name: 'Les Écolos',
      is_public: true,
    };

    it('throws ForbiddenException when user level < 3', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ feuilles: 50 });
      mockPrisma.levels.findFirst.mockResolvedValue({ level_number: 1 });

      await expect(service.createGroup('user-1', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when levels table is empty (level defaults to 1)', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ feuilles: 0 });
      mockPrisma.levels.findFirst.mockResolvedValue(null);

      await expect(service.createGroup('user-1', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(service.createGroup('unknown', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates group and membership when user level >= 3', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ feuilles: 300 });
      mockPrisma.levels.findFirst.mockResolvedValue({ level_number: 3 });
      const createdGroup = { id: 'group-1', ...dto, admin_id: 'user-1' };
      mockPrisma.groups.create.mockResolvedValue(createdGroup);
      mockPrisma.group_members.create.mockResolvedValue({});

      const result = await service.createGroup('user-1', dto);

      expect(mockPrisma.groups.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ admin_id: 'user-1', name: dto.name }),
        }),
      );
      expect(mockPrisma.group_members.create).toHaveBeenCalledWith({
        data: { group_id: 'group-1', user_id: 'user-1' },
      });
      expect(result).toEqual(createdGroup);
    });
  });

  // ──────────────────────────────────────────────
  // joinGroupByName
  // ──────────────────────────────────────────────
  describe('joinGroupByName', () => {
    it('throws NotFoundException when group not found or private', async () => {
      mockPrisma.groups.findFirst.mockResolvedValue(null);

      await expect(
        service.joinGroupByName('user-1', 'Unknown'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when user already a member', async () => {
      mockPrisma.groups.findFirst.mockResolvedValue({ id: 'g1' });
      mockPrisma.group_members.findUnique.mockResolvedValue({ id: 'mem-1' });

      await expect(
        service.joinGroupByName('user-1', 'Les Écolos'),
      ).rejects.toThrow(ConflictException);
    });

    it('creates membership when group is public and user not a member', async () => {
      const group = { id: 'g1', name: 'Les Écolos', is_public: true };
      mockPrisma.groups.findFirst.mockResolvedValue(group);
      mockPrisma.group_members.findUnique.mockResolvedValue(null);
      mockPrisma.group_members.create.mockResolvedValue({});

      const result = await service.joinGroupByName('user-2', 'Les Écolos');

      expect(mockPrisma.group_members.create).toHaveBeenCalledWith({
        data: { group_id: 'g1', user_id: 'user-2' },
      });
      expect(result).toEqual(group);
    });
  });

  // ──────────────────────────────────────────────
  // joinGroupByCode
  // ──────────────────────────────────────────────
  describe('joinGroupByCode', () => {
    it('throws NotFoundException when code is invalid', async () => {
      mockPrisma.groups.findFirst.mockResolvedValue(null);

      await expect(
        service.joinGroupByCode('user-1', 'bad-code'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when user already a member', async () => {
      mockPrisma.groups.findFirst.mockResolvedValue({ id: 'g1' });
      mockPrisma.group_members.findUnique.mockResolvedValue({ id: 'mem-1' });

      await expect(
        service.joinGroupByCode('user-1', 'valid-code'),
      ).rejects.toThrow(ConflictException);
    });

    it('creates membership for valid code and new user', async () => {
      const group = { id: 'g1', invite_code: 'valid-code', is_public: false };
      mockPrisma.groups.findFirst.mockResolvedValue(group);
      mockPrisma.group_members.findUnique.mockResolvedValue(null);
      mockPrisma.group_members.create.mockResolvedValue({});

      const result = await service.joinGroupByCode('user-2', 'valid-code');

      expect(mockPrisma.group_members.create).toHaveBeenCalledWith({
        data: { group_id: 'g1', user_id: 'user-2' },
      });
      expect(result).toEqual(group);
    });
  });

  // ──────────────────────────────────────────────
  // removeMember
  // ──────────────────────────────────────────────
  describe('removeMember', () => {
    it('throws NotFoundException when group does not exist', async () => {
      mockPrisma.groups.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMember('admin-1', 'g1', 'user-2'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when caller is not the admin', async () => {
      mockPrisma.groups.findUnique.mockResolvedValue({
        id: 'g1',
        admin_id: 'admin-1',
      });

      await expect(
        service.removeMember('other-user', 'g1', 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when admin tries to remove themselves', async () => {
      mockPrisma.groups.findUnique.mockResolvedValue({
        id: 'g1',
        admin_id: 'admin-1',
      });

      await expect(
        service.removeMember('admin-1', 'g1', 'admin-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deletes the target member when admin is valid', async () => {
      mockPrisma.groups.findUnique.mockResolvedValue({
        id: 'g1',
        admin_id: 'admin-1',
      });
      mockPrisma.group_members.delete.mockResolvedValue({});

      await service.removeMember('admin-1', 'g1', 'user-2');

      expect(mockPrisma.group_members.delete).toHaveBeenCalledWith({
        where: {
          group_id_user_id: { group_id: 'g1', user_id: 'user-2' },
        },
      });
    });
  });

  // ──────────────────────────────────────────────
  // deleteGroup
  // ──────────────────────────────────────────────
  describe('deleteGroup', () => {
    it('throws NotFoundException when group does not exist', async () => {
      mockPrisma.groups.findUnique.mockResolvedValue(null);

      await expect(service.deleteGroup('admin-1', 'g1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when caller is not the admin', async () => {
      mockPrisma.groups.findUnique.mockResolvedValue({
        id: 'g1',
        admin_id: 'admin-1',
      });

      await expect(service.deleteGroup('other-user', 'g1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deletes the group when admin is valid', async () => {
      mockPrisma.groups.findUnique.mockResolvedValue({
        id: 'g1',
        admin_id: 'admin-1',
      });
      mockPrisma.groups.delete.mockResolvedValue({});

      await service.deleteGroup('admin-1', 'g1');

      expect(mockPrisma.groups.delete).toHaveBeenCalledWith({
        where: { id: 'g1' },
      });
    });
  });

  // ──────────────────────────────────────────────
  // checkGroupActive
  // ──────────────────────────────────────────────
  describe('checkGroupActive', () => {
    it('returns isActive: false when member count < 3', async () => {
      mockPrisma.group_members.count.mockResolvedValue(2);

      const result = await service.checkGroupActive('g1');

      expect(result).toEqual({
        groupId: 'g1',
        isActive: false,
        memberCount: 2,
      });
    });

    it('returns isActive: true when member count >= 3', async () => {
      mockPrisma.group_members.count.mockResolvedValue(4);

      const result = await service.checkGroupActive('g1');

      expect(result).toEqual({ groupId: 'g1', isActive: true, memberCount: 4 });
    });

    it('returns isActive: true at exactly 3 members', async () => {
      mockPrisma.group_members.count.mockResolvedValue(3);

      const result = await service.checkGroupActive('g1');

      expect(result).toEqual({ groupId: 'g1', isActive: true, memberCount: 3 });
    });
  });
});
