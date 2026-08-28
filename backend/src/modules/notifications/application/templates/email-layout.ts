import { escapeHtml } from '../template';

interface EmailLayoutData {
  readonly greetingName: string;
  readonly heading: string;
  readonly body: string;
  readonly ctaLabel?: string;
  readonly ctaUrl?: string;
  readonly closing?: string;
}

const BRAND = 'Asociación de Desarrollo Integral de Curime';

export function renderEmailLayout(data: EmailLayoutData): string {
  const name = escapeHtml(data.greetingName);
  const heading = escapeHtml(data.heading);
  const body = escapeHtml(data.body);
  const closing = data.closing ? escapeHtml(data.closing) : '';
  const cta =
    data.ctaLabel && data.ctaUrl
      ? `<p style="margin:24px 0"><a href="${escapeHtml(data.ctaUrl)}" style="background:#2f6b3c;color:#ffffff;display:inline-block;padding:12px 20px;text-decoration:none;border-radius:4px;font-weight:700">${escapeHtml(data.ctaLabel)}</a></p><p style="font-size:13px;color:#4b5563">También puede copiar y pegar esta dirección:<br><a href="${escapeHtml(data.ctaUrl)}" style="color:#2f6b3c;word-break:break-all">${escapeHtml(data.ctaUrl)}</a></p>`
      : '';

  return `<!doctype html><html><body style="margin:0;background:#f5f5f0;color:#1f2937;font-family:'DM Sans',Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-top:4px solid #b6922e"><tr><td style="padding:32px"><p style="margin:0 0 16px;color:#2f6b3c;font-weight:700">${BRAND}</p><h1 style="font-size:24px;margin:0 0 20px">${heading}</h1><p>Hola, ${name}:</p><p>${body}</p>${cta}${closing ? `<p>${closing}</p>` : ''}<p style="margin-top:28px;color:#4b5563">${BRAND}</p></td></tr></table></td></tr></table></body></html>`;
}
