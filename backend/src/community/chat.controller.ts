import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { ChatService } from './chat.service';
import { ListMessagesQuery } from './dto/list-messages.query';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('groups')
@Controller('groups')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':id/messages')
  @ApiOperation({
    summary: 'Historique paginé des messages du groupe (curseur par date)',
  })
  @ApiResponse({ status: 200, description: 'Messages retournés' })
  @ApiResponse({ status: 403, description: 'Non membre du groupe' })
  listMessages(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query() query: ListMessagesQuery,
  ) {
    return this.chatService.listMessages(user.id, id, query);
  }

  @Post(':id/messages')
  @ApiOperation({
    summary:
      'Envoyer un message (persisté en base + broadcast Supabase Realtime)',
  })
  @ApiResponse({ status: 201, description: 'Message envoyé' })
  @ApiResponse({ status: 403, description: 'Non membre du groupe' })
  sendMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user.id, id, dto);
  }
}
