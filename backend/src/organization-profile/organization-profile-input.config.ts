export const ORGANIZATION_PROFILE_INPUT_ENV = {
  legalName: 'DB1_ORGANIZATION_LEGAL_NAME',
  legalIdentification: 'DB1_ORGANIZATION_LEGAL_IDENTIFICATION',
  dinadecoRegistrationCode: 'DB1_ORGANIZATION_DINADECO_REGISTRATION_CODE',
  organizationType: 'DB1_ORGANIZATION_TYPE',
  region: 'DB1_ORGANIZATION_REGION',
  province: 'DB1_ORGANIZATION_PROVINCE',
  canton: 'DB1_ORGANIZATION_CANTON',
  district: 'DB1_ORGANIZATION_DISTRICT',
  physicalAddress: 'DB1_ORGANIZATION_PHYSICAL_ADDRESS',
  notificationPhone: 'DB1_ORGANIZATION_NOTIFICATION_PHONE',
  notificationFax: 'DB1_ORGANIZATION_NOTIFICATION_FAX',
  notificationEmail: 'DB1_ORGANIZATION_NOTIFICATION_EMAIL',
} as const;

export interface CanonicalOrganizationProfileInput {
  legalName: string;
  legalIdentification: string;
  dinadecoRegistrationCode: string;
  organizationType: string;
  region: string;
  province: string;
  canton: string;
  district: string;
  physicalAddress: string;
  notificationPhone: string;
  notificationFax: string | null;
  notificationEmail: string;
}

type RequiredCanonicalOrganizationProfileField = Exclude<
  keyof CanonicalOrganizationProfileInput,
  'notificationFax'
>;

export function loadCanonicalOrganizationProfileInput(): CanonicalOrganizationProfileInput {
  return {
    legalName: requiredInput('legalName'),
    legalIdentification: requiredInput('legalIdentification'),
    dinadecoRegistrationCode: requiredInput('dinadecoRegistrationCode'),
    organizationType: requiredInput('organizationType'),
    region: requiredInput('region'),
    province: requiredInput('province'),
    canton: requiredInput('canton'),
    district: requiredInput('district'),
    physicalAddress: requiredInput('physicalAddress'),
    notificationPhone: requiredInput('notificationPhone'),
    notificationFax: optionalInput('notificationFax'),
    notificationEmail: requiredInput('notificationEmail'),
  };
}

function requiredInput(field: RequiredCanonicalOrganizationProfileField): string {
  const value = process.env[ORGANIZATION_PROFILE_INPUT_ENV[field]]?.trim();
  if (!value) {
    throw new Error(
      `${ORGANIZATION_PROFILE_INPUT_ENV[field]} must be configured with a nonblank value.`,
    );
  }
  return value;
}

function optionalInput(field: 'notificationFax'): string | null {
  return process.env[ORGANIZATION_PROFILE_INPUT_ENV[field]]?.trim() || null;
}
