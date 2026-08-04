/** Strips a Honduran number down to its 8-digit local form, dropping a leading "504" country code if present. */
function toLocalHonduranNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 8 && digits.startsWith("504") ? digits.slice(3) : digits;
}

/** Honduran landlines start with 2 (call-only); mobile numbers start with 3, 8, or 9 (have WhatsApp). */
export function isHonduranMobileNumber(phone: string): boolean {
  return /^[389]/.test(toLocalHonduranNumber(phone));
}
