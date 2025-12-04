/**
 * Zipcode utilities for location-based matching
 * Uses the 'zipcodes' library for US zipcode validation and geocoding
 */

import zipcodes from 'zipcodes';
import { getDistance } from 'geolib';

export interface ZipcodeData {
  zipcode: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

/**
 * Validates if a string is a valid US zipcode (5 or 9 digits)
 * Supports formats: 12345 or 12345-6789
 */
export function isValidZipcode(zipcode: string): boolean {
  if (!zipcode) return false;
  
  // Remove any whitespace
  const cleaned = zipcode.trim();
  
  // Check format: 5 digits or 5+4 digits with hyphen
  const zipcodeRegex = /^\d{5}(-\d{4})?$/;
  if (!zipcodeRegex.test(cleaned)) {
    return false;
  }
  
  // Verify it exists in the zipcodes database
  const data = zipcodes.lookup(cleaned.split('-')[0]);
  return data !== undefined;
}

/**
 * Converts a zipcode to geographic coordinates
 * Returns null if zipcode is invalid
 */
export function zipcodeToCoordinates(zipcode: string): ZipcodeData | null {
  if (!zipcode) return null;
  
  const cleaned = zipcode.trim().split('-')[0]; // Use first 5 digits
  const data = zipcodes.lookup(cleaned);
  
  if (!data) return null;
  
  return {
    zipcode: cleaned,
    latitude: data.latitude,
    longitude: data.longitude,
    city: data.city,
    state: data.state,
  };
}

/**
 * Gets city and state from zipcode for display purposes
 * Returns formatted string like "San Francisco, CA" or null if invalid
 */
export function zipcodeToLocation(zipcode: string): string | null {
  const data = zipcodeToCoordinates(zipcode);
  if (!data) return null;
  
  return `${data.city}, ${data.state}`;
}

/**
 * Calculates distance between two zipcodes in kilometers
 * Returns null if either zipcode is invalid
 */
export function calculateZipcodeDistance(
  zipcode1: string,
  zipcode2: string
): number | null {
  const coords1 = zipcodeToCoordinates(zipcode1);
  const coords2 = zipcodeToCoordinates(zipcode2);
  
  if (!coords1 || !coords2) return null;
  
  // getDistance returns meters, convert to kilometers
  const distanceMeters = getDistance(
    { latitude: coords1.latitude, longitude: coords1.longitude },
    { latitude: coords2.latitude, longitude: coords2.longitude }
  );
  
  return distanceMeters / 1000;
}

/**
 * Formats a zipcode string (removes extra spaces, validates format)
 * Returns formatted zipcode or null if invalid
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

/**
 * Searches for zipcodes near a given zipcode within a radius
 * Note: This is a basic implementation. For production, use PostGIS queries.
 * 
 * @param centerZipcode The center point zipcode
 * @param radiusKm Radius in kilometers
 * @param candidateZipcodes Array of zipcodes to filter
 * @returns Array of zipcodes within the radius
 */
export function findZipcodesInRadius(
  centerZipcode: string,
  radiusKm: number,
  candidateZipcodes: string[]
): string[] {
  const centerCoords = zipcodeToCoordinates(centerZipcode);
  if (!centerCoords) return [];
  
  return candidateZipcodes.filter(zipcode => {
    const distance = calculateZipcodeDistance(centerZipcode, zipcode);
    return distance !== null && distance <= radiusKm;
  });
}

/**
 * Gets approximate radius bounds for a zipcode
 * Returns { minLat, maxLat, minLng, maxLng } for bounding box queries
 * Useful for initial filtering before precise distance calculations
 */
export function getZipcodeBounds(zipcode: string, radiusKm: number) {
  const coords = zipcodeToCoordinates(zipcode);
  if (!coords) return null;
  
  // Rough approximation: 1 degree latitude ≈ 111 km
  // 1 degree longitude varies by latitude, approximately 111km * cos(latitude)
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((coords.latitude * Math.PI) / 180));
  
  return {
    minLat: coords.latitude - latDelta,
    maxLat: coords.latitude + latDelta,
    minLng: coords.longitude - lngDelta,
    maxLng: coords.longitude + lngDelta,
  };
}

/**
 * Validates and normalizes a zipcode for storage
 * Throws an error with user-friendly message if invalid
 */
export function validateAndNormalizeZipcode(zipcode: string): {
  zipcode: string;
  latitude: number;
  longitude: number;
} {
  const formatted = formatZipcode(zipcode);
  
  if (!formatted) {
    throw new Error('Please enter a valid 5-digit US zipcode (e.g., 12345)');
  }
  
  const coords = zipcodeToCoordinates(formatted);
  
  if (!coords) {
    throw new Error('Zipcode not found. Please enter a valid US zipcode.');
  }
  
  return {
    zipcode: coords.zipcode, // Use 5-digit format
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

