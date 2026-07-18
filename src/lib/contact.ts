/**
 * contact.ts — pequenas defesas contra scraping ingênuo (bots) sem
 * sacrificar acessibilidade. O endereço é montado em runtime no client,
 * de forma que crawlers que só leem HTML estático não o capturem direto.
 */

const EMAIL_USER = "jarbasaarcanjo";
const EMAIL_DOMAIN = "gmail.com";

const TEL_PARTS = ["+55", "31", "9", "9318-8052"];

export function getEmail(): string {
  return `${EMAIL_USER}@${EMAIL_DOMAIN}`;
}

export function getEmailHref(subject?: string): string {
  const base = `mailto:${getEmail()}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}

export function getTel(): string {
  return TEL_PARTS.join(" ");
}

export function getTelHref(): string {
  return `tel:${TEL_PARTS.join("").replace(/\D/g, "")}`;
}
