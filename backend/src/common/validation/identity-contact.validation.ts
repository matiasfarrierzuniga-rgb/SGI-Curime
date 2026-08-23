import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export type SupportedIdentificationType = 'NATIONAL' | 'DIMEX';

export const NATIONAL_IDENTIFICATION_PATTERN = /^[1-9][0-9]{8}$/;
export const DIMEX_IDENTIFICATION_PATTERN = /^[0-9]{12}$/;
export const COUNTRY_CODE_PATTERN = /^\+[1-9][0-9]{0,3}$/;
export const NATIONAL_NUMBER_PATTERN = /^[0-9]+$/;
export const FULL_NAME_PATTERN =
  /^(?=.*\p{L})[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u;

export function isValidIdentification(
  type: SupportedIdentificationType,
  identification: string,
): boolean {
  return type === 'NATIONAL'
    ? NATIONAL_IDENTIFICATION_PATTERN.test(identification)
    : type === 'DIMEX' && DIMEX_IDENTIFICATION_PATTERN.test(identification);
}

export function isValidPhone(
  countryCode?: string,
  nationalNumber?: string,
): boolean {
  if (countryCode === undefined && nationalNumber === undefined) return true;
  if (
    !countryCode ||
    !nationalNumber ||
    !COUNTRY_CODE_PATTERN.test(countryCode)
  )
    return false;
  if (!NATIONAL_NUMBER_PATTERN.test(nationalNumber)) return false;
  if (countryCode === '+506' && nationalNumber.length !== 8) return false;
  return countryCode.slice(1).length + nationalNumber.length <= 15;
}

export function IsIdentificationFor(
  typeProperty: string,
  options?: ValidationOptions,
) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isIdentificationFor',
      target: object.constructor,
      propertyName,
      constraints: [typeProperty],
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const type = (args.object as Record<string, unknown>)[typeProperty];
          return (
            typeof value === 'string' &&
            (type === 'NATIONAL' || type === 'DIMEX') &&
            isValidIdentification(type, value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          const type = (args.object as Record<string, unknown>)[typeProperty];
          return type === 'DIMEX'
            ? 'DIMEX: debe contener exactamente 12 dígitos.'
            : 'Cédula nacional: debe contener exactamente 9 dígitos y no iniciar en 0.';
        },
      },
    });
}

export function IsPhoneFor(
  countryCodeProperty: string,
  options?: ValidationOptions,
) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isPhoneFor',
      target: object.constructor,
      propertyName,
      constraints: [countryCodeProperty],
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const code = (args.object as Record<string, unknown>)[
            countryCodeProperty
          ];
          return isValidPhone(
            typeof code === 'string' ? code : undefined,
            typeof value === 'string' ? value : undefined,
          );
        },
        defaultMessage(args: ValidationArguments) {
          const code = (args.object as Record<string, unknown>)[
            countryCodeProperty
          ];
          return code === '+506'
            ? 'Teléfono de Costa Rica: debe contener exactamente 8 dígitos.'
            : 'El teléfono internacional no es válido.';
        },
      },
    });
}
