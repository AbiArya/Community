import {
  isValidZipcode,
  zipcodeToCoordinates,
  zipcodeToLocation,
  calculateZipcodeDistance,
  formatZipcode,
  validateAndNormalizeZipcode,
} from '../zipcode';

describe('Zipcode Utilities', () => {
  describe('isValidZipcode', () => {
    it('should validate correct 5-digit zipcodes', () => {
      expect(isValidZipcode('94102')).toBe(true); // San Francisco
      expect(isValidZipcode('10001')).toBe(true); // New York
      expect(isValidZipcode('90210')).toBe(true); // Beverly Hills
    });

    it('should validate zipcodes with +4 extension', () => {
      expect(isValidZipcode('94102-1234')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidZipcode('1234')).toBe(false); // Too short
      expect(isValidZipcode('123456')).toBe(false); // Too long
      expect(isValidZipcode('abcde')).toBe(false); // Letters
      expect(isValidZipcode('')).toBe(false); // Empty
      expect(isValidZipcode('00000')).toBe(false); // Invalid zipcode
    });

    it('should handle whitespace', () => {
      expect(isValidZipcode(' 94102 ')).toBe(true);
    });
  });

  describe('zipcodeToCoordinates', () => {
    it('should return coordinates for valid zipcodes', () => {
      const result = zipcodeToCoordinates('94102');
      expect(result).not.toBeNull();
      expect(result?.zipcode).toBe('94102');
      expect(result?.latitude).toBeCloseTo(37.78, 1);
      expect(result?.longitude).toBeCloseTo(-122.41, 1);
      expect(result?.city).toBe('San Francisco');
      expect(result?.state).toBe('CA');
    });

    it('should handle +4 zipcodes', () => {
      const result = zipcodeToCoordinates('94102-1234');
      expect(result).not.toBeNull();
      expect(result?.zipcode).toBe('94102');
    });

    it('should return null for invalid zipcodes', () => {
      expect(zipcodeToCoordinates('00000')).toBeNull();
      expect(zipcodeToCoordinates('invalid')).toBeNull();
      expect(zipcodeToCoordinates('')).toBeNull();
    });
  });

  describe('zipcodeToLocation', () => {
    it('should return formatted location string', () => {
      const location = zipcodeToLocation('94102');
      expect(location).toBe('San Francisco, CA');
    });

    it('should return null for invalid zipcodes', () => {
      expect(zipcodeToLocation('00000')).toBeNull();
    });
  });

  describe('calculateZipcodeDistance', () => {
    it('should calculate distance between two zipcodes', () => {
      // San Francisco to Los Angeles
      const distance = calculateZipcodeDistance('94102', '90210');
      expect(distance).not.toBeNull();
      expect(distance!).toBeGreaterThan(500); // Roughly 559 km
      expect(distance!).toBeLessThan(600);
    });

    it('should return 0 for same zipcode', () => {
      const distance = calculateZipcodeDistance('94102', '94102');
      expect(distance).toBe(0);
    });

    it('should return null if either zipcode is invalid', () => {
      expect(calculateZipcodeDistance('94102', '00000')).toBeNull();
      expect(calculateZipcodeDistance('00000', '94102')).toBeNull();
    });
  });

  describe('formatZipcode', () => {
    it('should format 5-digit zipcodes', () => {
      expect(formatZipcode('94102')).toBe('94102');
      expect(formatZipcode(' 94102 ')).toBe('94102');
    });

    it('should format 9-digit zipcodes', () => {
      expect(formatZipcode('941021234')).toBe('94102-1234');
      expect(formatZipcode('94102-1234')).toBe('94102-1234');
    });

    it('should return null for invalid formats', () => {
      expect(formatZipcode('1234')).toBeNull();
      expect(formatZipcode('abcde')).toBeNull();
      expect(formatZipcode('')).toBeNull();
    });
  });

  describe('validateAndNormalizeZipcode', () => {
    it('should validate and return normalized zipcode data', () => {
      const result = validateAndNormalizeZipcode('94102');
      expect(result.zipcode).toBe('94102');
      expect(result.latitude).toBeCloseTo(37.78, 1);
      expect(result.longitude).toBeCloseTo(-122.41, 1);
    });

    it('should handle whitespace and +4 extensions', () => {
      const result = validateAndNormalizeZipcode(' 94102-1234 ');
      expect(result.zipcode).toBe('94102');
    });

    it('should throw error for invalid zipcodes', () => {
      expect(() => validateAndNormalizeZipcode('00000'))
        .toThrow('not found');
      expect(() => validateAndNormalizeZipcode('1234'))
        .toThrow('valid 5-digit');
    });
  });
});

