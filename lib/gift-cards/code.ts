const CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomCodePart(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => CODE_CHARS[byte % CODE_CHARS.length]).join("");
}

export function generateGiftCardCode(): string {
  return `MANU-${randomCodePart(4)}-${randomCodePart(4)}`;
}

export function normalizeGiftCardCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidGiftCardCodeFormat(code: string): boolean {
  return /^MANU-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/.test(
    code,
  );
}
