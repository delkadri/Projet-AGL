import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from 'nestjs-prisma';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  private async getUserLevel(userId: string): Promise<number> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    const level = await this.prisma.levels.findFirst({
      where: { required_feuilles: { lte: user.feuilles } },
      orderBy: { required_feuilles: 'desc' },
    });
    return level ? level.level_number : 1;
  }

  private async assertNotAlreadyMember(
    groupId: string,
    userId: string,
  ): Promise<void> {
    const existing = await this.prisma.group_members.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });
    if (existing) throw new ConflictException('Déjà membre de ce groupe');
  }

  async createGroup(userId: string, dto: CreateGroupDto) {
    const niveau = await this.getUserLevel(userId);
    if (niveau < 3) {
      throw new ForbiddenException(
        'Niveau 3 requis pour créer un groupe',
      );
    }

    const group = await this.prisma.groups.create({
      data: {
        name: dto.name,
        description: dto.description,
        is_public: dto.is_public,
        admin_id: userId,
        invite_code: randomUUID(),
      },
    });

    await this.prisma.group_members.create({
      data: { group_id: group.id, user_id: userId },
    });

    return group;
  }

  async joinGroupByName(userId: string, name: string) {
    const group = await this.prisma.groups.findFirst({
      where: { name, is_public: true },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    await this.assertNotAlreadyMember(group.id, userId);

    await this.prisma.group_members.create({
      data: { group_id: group.id, user_id: userId },
    });

    return group;
  }

  async joinGroupByCode(userId: string, code: string) {
    const group = await this.prisma.groups.findFirst({
      where: { invite_code: code },
    });
    if (!group) throw new NotFoundException('Code invalide');

    await this.assertNotAlreadyMember(group.id, userId);

    await this.prisma.group_members.create({
      data: { group_id: group.id, user_id: userId },
    });

    return group;
  }

  async removeMember(
    adminId: string,
    groupId: string,
    targetUserId: string,
  ): Promise<void> {
    const group = await this.prisma.groups.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');
    if (group.admin_id !== adminId) {
      throw new ForbiddenException("Action réservée à l'admin");
    }
    if (targetUserId === adminId) {
      throw new ForbiddenException("L'admin ne peut pas se supprimer");
    }

    await this.prisma.group_members.delete({
      where: {
        group_id_user_id: { group_id: groupId, user_id: targetUserId },
      },
    });
  }

  async deleteGroup(adminId: string, groupId: string): Promise<void> {
    const group = await this.prisma.groups.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');
    if (group.admin_id !== adminId) {
      throw new ForbiddenException("Action réservée à l'admin");
    }

    await this.prisma.groups.delete({ where: { id: groupId } });
  }

  async checkGroupActive(
    groupId: string,
  ): Promise<{ groupId: string; isActive: boolean; memberCount: number }> {
    const memberCount = await this.prisma.group_members.count({
      where: { group_id: groupId },
    });
    return { groupId, isActive: memberCount >= 3, memberCount };
  }
}
