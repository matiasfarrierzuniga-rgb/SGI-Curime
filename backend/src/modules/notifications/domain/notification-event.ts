import type { EmailAddress } from './email-message';

export enum NotificationCategory {
  SECURITY = 'SECURITY',
  OPERATIONAL = 'OPERATIONAL',
  INFORMATIONAL = 'INFORMATIONAL',
}

export enum NotificationEventType {
  ACCOUNT_ACTIVATION_REQUESTED = 'ACCOUNT_ACTIVATION_REQUESTED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  USER_REQUEST_APPROVED = 'USER_REQUEST_APPROVED',
  USER_REQUEST_REJECTED = 'USER_REQUEST_REJECTED',
  AFFILIATE_REQUEST_APPROVED = 'AFFILIATE_REQUEST_APPROVED',
  AFFILIATE_REQUEST_REJECTED = 'AFFILIATE_REQUEST_REJECTED',
  CONTACT_REQUEST_RECEIVED = 'CONTACT_REQUEST_RECEIVED',
}

export const NOTIFICATION_EVENT_CATEGORIES = {
  [NotificationEventType.ACCOUNT_ACTIVATION_REQUESTED]:
    NotificationCategory.SECURITY,
  [NotificationEventType.PASSWORD_RESET_REQUESTED]:
    NotificationCategory.SECURITY,
  [NotificationEventType.PASSWORD_CHANGED]: NotificationCategory.SECURITY,
  [NotificationEventType.USER_REQUEST_APPROVED]:
    NotificationCategory.OPERATIONAL,
  [NotificationEventType.USER_REQUEST_REJECTED]:
    NotificationCategory.OPERATIONAL,
  [NotificationEventType.AFFILIATE_REQUEST_APPROVED]:
    NotificationCategory.OPERATIONAL,
  [NotificationEventType.AFFILIATE_REQUEST_REJECTED]:
    NotificationCategory.OPERATIONAL,
  [NotificationEventType.CONTACT_REQUEST_RECEIVED]:
    NotificationCategory.INFORMATIONAL,
} as const satisfies Record<NotificationEventType, NotificationCategory>;

interface RecipientData {
  readonly userId?: number;
  readonly to: EmailAddress;
  readonly recipientName: string;
  readonly idempotencyKey?: string;
}

export type NotificationIntent =
  | (RecipientData & {
      readonly type: NotificationEventType.ACCOUNT_ACTIVATION_REQUESTED;
      readonly token: string;
      readonly expiresAt: Date;
    })
  | (RecipientData & {
      readonly type: NotificationEventType.PASSWORD_RESET_REQUESTED;
      readonly token: string;
    })
  | (RecipientData & { readonly type: NotificationEventType.PASSWORD_CHANGED })
  | (RecipientData & {
      readonly type:
        | NotificationEventType.USER_REQUEST_APPROVED
        | NotificationEventType.USER_REQUEST_REJECTED
        | NotificationEventType.AFFILIATE_REQUEST_APPROVED
        | NotificationEventType.AFFILIATE_REQUEST_REJECTED
        | NotificationEventType.CONTACT_REQUEST_RECEIVED;
    });
