/**
 * Brazilian Phone and WhatsApp Formatting Utilities
 */

/**
 * Formats a raw phone string into Brazilian format:
 * - 10 digits: (XX) XXXX-XXXX
 * - 11 digits: (XX) 9XXXX-XXXX
 * Handles incremental typing gracefully.
 */
export function formatWhatsAppPhone(value: string): string {
  if (!value) return '';

  // Extract only digits
  let digits = value.replace(/\D/g, '');

  // If user typed/pasted international prefix 55 with 12 or 13 digits, strip the leading 55
  if (digits.length > 11 && digits.startsWith('55')) {
    digits = digits.slice(2);
  }

  // Cap at 11 digits (2 DDD + 9 mobile number)
  digits = digits.slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Returns clean digits ready for WhatsApp URL (wa.me/55...)
 * Prepends '55' (Brazil country code) if DDD + number has 10 or 11 digits.
 */
export function getCleanWhatsAppDigits(phone: string): string {
  let digits = (phone || '').replace(/\D/g, '');

  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  return digits || '5511987654321';
}
