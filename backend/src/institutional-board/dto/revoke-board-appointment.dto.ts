import { IsDateString } from 'class-validator';

export class RevokeBoardAppointmentDto {
  @IsDateString({ strict: true })
  endsOn!: string;
}
