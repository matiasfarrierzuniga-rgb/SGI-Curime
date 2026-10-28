import { BadRequestException, Injectable } from '@nestjs/common';

const HACIENDA_LOOKUP_URL = 'https://api.hacienda.go.cr/fe/ae';
const LOOKUP_TIMEOUT_MS = 6_000;

type HaciendaIdentityResponse = {
  nombre?: unknown;
  tipoIdentificacion?: unknown;
};

export type IdentityLookupResult =
  | {
      found: true;
      normalizedIdentification: string;
      identificationType: 'NATIONAL' | 'DIMEX';
      sourceIdentificationType: string;
      nombreCompleto: string;
      suggestedNames: {
        firstName: string;
        firstSurname: string;
        secondSurname: string;
      };
    }
  | {
      found: false;
      normalizedIdentification: string;
      message: string;
    };

@Injectable()
export class IdentityLookupService {
  async lookup(identification: string): Promise<IdentityLookupResult> {
    const normalizedIdentification = identification.replace(/\D/g, '');
    this.validateIdentification(normalizedIdentification);

    try {
      const response = await fetch(
        `${HACIENDA_LOOKUP_URL}?identificacion=${encodeURIComponent(normalizedIdentification)}`,
        {
          headers: { Accept: 'application/json', 'User-Agent': 'SGI-Curime/1.0' },
          signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
        },
      );

      if (!response.ok) return this.notFound(normalizedIdentification);

      const data = (await response.json()) as HaciendaIdentityResponse;
      const fullName =
        typeof data.nombre === 'string'
          ? data.nombre.trim()
          : '';
      const sourceIdentificationType =
        typeof data.tipoIdentificacion === 'string'
          ? data.tipoIdentificacion.trim()
          : typeof data.tipoIdentificacion === 'number'
            ? String(data.tipoIdentificacion).padStart(2, '0')
            : '';

      if (!fullName) return this.notFound(normalizedIdentification);
      if (sourceIdentificationType === '02') {
        return {
          found: false,
          normalizedIdentification,
          message:
            'La identificación corresponde a una persona jurídica. Ingrese los datos de la persona manualmente.',
        };
      }
      if (
        sourceIdentificationType &&
        sourceIdentificationType !== '01' &&
        sourceIdentificationType !== '03'
      ) {
        return {
          found: false,
          normalizedIdentification,
          message:
            'Hacienda devolvió un tipo de identificación no compatible con este formulario. Ingrese los datos manualmente.',
        };
      }

      const identificationType =
        sourceIdentificationType === '03' || normalizedIdentification.length === 12
          ? 'DIMEX'
          : 'NATIONAL';

      return {
        found: true,
        normalizedIdentification,
        identificationType,
        sourceIdentificationType,
        nombreCompleto: fullName,
        suggestedNames: this.suggestStructuredNames(fullName),
      };
    } catch {
      return {
        found: false,
        normalizedIdentification,
        message:
          'No fue posible consultar Hacienda en este momento. Puede continuar con el ingreso manual.',
      };
    }
  }

  private validateIdentification(identification: string): void {
    const isNational = identification.length === 9 && identification[0] !== '0';
    const isDimex = identification.length === 12;
    if (!isNational && !isDimex) {
      throw new BadRequestException(
        'La identificación debe ser una cédula nacional de 9 dígitos que no inicie en 0 o un DIMEX de 12 dígitos.',
      );
    }
  }

  private suggestStructuredNames(fullName: string) {
    const parts = fullName.split(/\s+/);
    let firstName = fullName;
    let firstSurname = '';
    let secondSurname = '';

    if (parts.length >= 3) {
      secondSurname = parts.pop() ?? '';
      firstSurname = parts.pop() ?? '';
      firstName = parts.join(' ');
    } else if (parts.length === 2) {
      firstSurname = parts.pop() ?? '';
      firstName = parts[0];
    }

    return { firstName, firstSurname, secondSurname };
  }

  private notFound(normalizedIdentification: string): IdentityLookupResult {
    return {
      found: false,
      normalizedIdentification,
      message:
        'Hacienda no devolvió un nombre para esta identificación. Puede continuar con el ingreso manual.',
    };
  }
}
