/**
 * Client-side zipcode utilities
 * 
 * These functions call the /api/zipcode endpoint to perform zipcode operations
 * server-side, avoiding shipping the 4.4MB zipcodes database to the client.
 */

export interface ZipcodeData {
  zipcode: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

/**
 * Validates if a string is a valid US zipcode
 */
export async function isValidZipcode(zipcode: string): Promise<boolean> {
  if (!zipcode) return false;
  
  try {
    const response = await fetch(
      `/api/zipcode?zipcode=${encodeURIComponent(zipcode)}&action=validate`
    );
    const data = await response.json();
    return data.isValid === true;
  } catch {
    return false;
  }
}

/**
 * Converts a zipcode to geographic coordinates
 * Returns null if zipcode is invalid
 */
export async function zipcodeToCoordinates(zipcode: string): Promise<ZipcodeData | null> {
  if (!zipcode) return null;
  
  try {
    const response = await fetch(
      `/api/zipcode?zipcode=${encodeURIComponent(zipcode)}&action=coordinates`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Gets city and state from zipcode for display purposes
 * Returns formatted string like "San Francisco, CA" or null if invalid
 */
export async function zipcodeToLocation(zipcode: string): Promise<string | null> {
  if (!zipcode) return null;
  
  try {
    const response = await fetch(
      `/api/zipcode?zipcode=${encodeURIComponent(zipcode)}&action=location`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.location || null;
  } catch {
    return null;
  }
}

/**
 * Validates and normalizes a zipcode for storage
 * Throws an error with user-friendly message if invalid
 */
export async function validateAndNormalizeZipcode(zipcode: string): Promise<{
  zipcode: string;
  latitude: number;
  longitude: number;
}> {
  const response = await fetch(
    `/api/zipcode?zipcode=${encodeURIComponent(zipcode)}&action=normalize`
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Invalid zipcode');
  }
  
  return data;
}

/**
 * Synchronous format check for basic zipcode format validation (client-side only)
 * This does NOT check if the zipcode exists, only if the format is valid.
 * Use for immediate UI feedback before server validation.
 */
export function isValidZipcodeFormat(zipcode: string): boolean {
  if (!zipcode) return false;
  const cleaned = zipcode.trim();
  const zipcodeRegex = /^\d{5}(-\d{4})?$/;
  return zipcodeRegex.test(cleaned);
}

/**
 * Formats a zipcode string (removes extra spaces, validates format)
 * This is a synchronous operation that only validates format.
 * Returns formatted zipcode or null if invalid format.
 */
export function formatZipcode(zipcode: string): string | null {
  if (!zipcode) return null;
  
  const cleaned = zipcode.trim().replace(/\s+/g, '');
  
  // Handle 5-digit zipcode
  if (/^\d{5}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Handle 9-digit zipcode (with or without hyphen)
  if (/^\d{9}$/.test(cleaned)) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  
  if (/^\d{5}-\d{4}$/.test(cleaned)) {
    return cleaned;
  }
  
  return null;
}

