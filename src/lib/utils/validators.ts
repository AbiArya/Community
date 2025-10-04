export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  // Simple RFC 5322-inspired pattern sufficient for UI validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}


