import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParcoursService } from './parcours.service';
import { ParcoursDto } from '../auth/dto/user-profile.dto'; // Réutilisation du DTO Swagger

@ApiTags('parcours')
@Controller('parcours')
export class ParcoursController {
  constructor(private readonly parcoursService: ParcoursService) { }

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste des parcours disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Liste des parcours',
    type: [ParcoursDto],
  })
  async getAllParcours(): Promise<ParcoursDto[]> {
    return this.parcoursService.getAllParcours();
  }
}
