import { ApiProperty } from '@nestjs/swagger';

class GroupSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty() member_count: number;
  @ApiProperty() is_private: boolean;
  @ApiProperty() created_at: string;
  @ApiProperty() updated_at: string;
}

export class UserGroupMembershipDto {
  @ApiProperty({ type: GroupSummaryDto }) community: GroupSummaryDto;
  @ApiProperty({ enum: ['ADMIN', 'MEMBER'] }) role: 'ADMIN' | 'MEMBER';
  @ApiProperty() joined_at: string;
  @ApiProperty() has_pending_defi: boolean;
}
