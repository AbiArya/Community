/**
 * Photo Delete API
 * 
 * POST /api/photos/delete
 * Deletes photos from S3 storage
 * 
 * This endpoint:
 * 1. Validates the user is authenticated
 * 2. Deletes specified photos from S3
 * 
 * Note: Database cleanup is handled separately by the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deletePhotos, isS3Configured } from '@/lib/aws/storage';

// Supabase client for auth verification
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

interface DeletePhotosRequest {
  s3Keys: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Check S3 configuration
    if (!isS3Configured()) {
      // If S3 not configured, just return success (photos may be in Supabase storage)
      return NextResponse.json({ success: true, deleted: 0 });
    }

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseAdmin();

    // Verify the user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: DeletePhotosRequest = await request.json();
    const { s3Keys } = body;

    if (!s3Keys || !Array.isArray(s3Keys)) {
      return NextResponse.json(
        { error: 'Missing required field: s3Keys (array)' },
        { status: 400 }
      );
    }

    // Filter to only delete photos belonging to this user
    // S3 keys are formatted as: photos/{userId}/{timestamp}-{randomId}.{ext}
    const userKeys = s3Keys.filter(key => {
      const keyParts = key.split('/');
      return keyParts.length >= 2 && keyParts[1] === user.id;
    });

    if (userKeys.length !== s3Keys.length) {
      console.warn(`User ${user.id} attempted to delete photos not belonging to them`);
    }

    // Delete the photos
    if (userKeys.length > 0) {
      await deletePhotos(userKeys);
    }

    return NextResponse.json({
      success: true,
      deleted: userKeys.length,
    });

  } catch (error) {
    console.error('Error deleting photos:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete photos',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

