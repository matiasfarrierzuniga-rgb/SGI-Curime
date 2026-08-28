export interface RenderedEmailTemplate {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  };
  return value.replace(/[&<>'"]/g, (character) => entities[character]);
}

export function assertSafeSubject(subject: string): string {
  if (/\r|\n/.test(subject)) {
    throw new Error('Email subjects cannot contain CR or LF characters.');
  }
  return subject;
}
