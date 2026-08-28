import { Inject, Injectable } from '@nestjs/common';

export interface NotificationUrlConfig {
  readonly baseUrl: string;
}

export const NOTIFICATION_URL_CONFIG = Symbol('NOTIFICATION_URL_CONFIG');

@Injectable()
export class NotificationUrlBuilder {
  private readonly baseUrl: URL;

  constructor(@Inject(NOTIFICATION_URL_CONFIG) config: NotificationUrlConfig) {
    this.baseUrl = new URL(config.baseUrl);
  }

  activation(token: string): string {
    return this.withToken('/activate-account', token);
  }

  passwordReset(token: string): string {
    return this.withToken('/reset-password', token);
  }

  private withToken(pathname: string, token: string): string {
    const url = new URL(pathname, this.baseUrl);
    url.search = new URLSearchParams({ token }).toString();
    return url.toString();
  }
}
