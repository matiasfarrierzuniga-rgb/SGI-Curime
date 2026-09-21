import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateInstitutionalProfileDto } from './update-institutional-profile.dto';

describe('UpdateInstitutionalProfileDto', () => {
  it('trims strings, lowercases email, and converts blank values to null', async () => {
    const dto = plainToInstance(UpdateInstitutionalProfileDto, {
      legalName: '  Asociación de Prueba  ', email: ' CONTACTO@PRUEBA.TEST ', phone: '   ',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({ legalName: 'Asociación de Prueba', email: 'contacto@prueba.test', phone: null });
  });

  it('rejects an invalid non-null email', async () => {
    const errors = await validate(plainToInstance(UpdateInstitutionalProfileDto, { email: 'correo inválido' }));
    expect(errors[0]?.property).toBe('email');
  });
});
