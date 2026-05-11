import { ApiProperty } from '@nestjs/swagger';

class LeaderboardCommunityDto {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiProperty() member_count: number;
}

class LeaderboardWinStreakDto {
  @ApiProperty() count: number;
  @ApiProperty({ enum: ['active', 'at_risk', 'broken'] })
  status: 'active' | 'at_risk' | 'broken';
}

export class InterCommunityLeaderboardEntryDto {
  @ApiProperty() rank: number;
  @ApiProperty({ type: LeaderboardCommunityDto })
  community: LeaderboardCommunityDto;
  @ApiProperty() average_carbon_tco2e_per_year: number;
  @ApiProperty({ type: LeaderboardWinStreakDto })
  win_streak: LeaderboardWinStreakDto;
}
