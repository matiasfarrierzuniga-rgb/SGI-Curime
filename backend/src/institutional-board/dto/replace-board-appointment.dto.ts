import { IsDateString } from 'class-validator';
import { CreateBoardAppointmentDto } from './board-appointment.dto';

export class ReplaceBoardAppointmentDto extends CreateBoardAppointmentDto {
  @IsDateString({ strict: true }) replacedEndsOn!: string;
}
