/**
 * API route for zipcode validation and lookup
 * 
 * This keeps the heavy zipcodes database (4.4MB) server-side
 * instead of shipping it to the client bundle.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  isValidZipcode,
  zipcodeToCoordinates,
  zipcodeToLocation,
  validateAndNormalizeZipcode,
} from '@/lib/utils/zipcode';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zipcode = searchParams.get('zipcode');
  const action = searchParams.get('action') || 'validate';

  if (!zipcode) {
    return NextResponse.json(
      { error: 'Zipcode parameter is required' },
      { status: 400 }
    );
  }

  try {
    switch (action) {
      case 'validate': {
        const isValid = isValidZipcode(zipcode);
        return NextResponse.json({ isValid });
      }

      case 'coordinates': {
        const coords = zipcodeToCoordinates(zipcode);
        if (!coords) {
          return NextResponse.json(
            { error: 'Invalid zipcode' },
            { status: 404 }
          );
        }
        return NextResponse.json(coords);
      }

      case 'location': {
        const location = zipcodeToLocation(zipcode);
        if (!location) {
          return NextResponse.json(
            { error: 'Invalid zipcode' },
            { status: 404 }
          );
        }
        return NextResponse.json({ location });
      }

      case 'normalize': {
        const normalized = validateAndNormalizeZipcode(zipcode);
        return NextResponse.json(normalized);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

