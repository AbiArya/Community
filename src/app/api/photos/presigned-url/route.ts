/**
 * Photo Upload Presigned URL API
 * 
 * POST /api/photos/presigned-url
 * Generates presigned URLs for direct upload to S3
 * 
 * This endpoint:
 * 1. Validates the user is authenticated
 * 2. Validates the file type and size constraints
 * 3. Returns a presigned URL for direct S3 upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateUploadUrl, isValidImageType, isS3Configured } from '@/lib/aws/storage';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

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

interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
}

export async function POST(request: NextRequest) {
  try {
    // Check S3 configuration
    if (!isS3Configured()) {
      return NextResponse.json(
        { error: 'S3 storage not configured' },
        { status: 503 }
      );
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
    const body: PresignedUrlRequest = await request.json();
    const { fileName, contentType, fileSize } = body;

    // Validate required fields
    if (!fileName || !contentType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, contentType, fileSize' },
        { status: 400 }
      );
    }

    // Validate content type
    if (!isValidImageType(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Accepted types: JPEG, PNG, WebP, HEIC' },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate presigned URL
    const { uploadUrl, s3Key, cloudFrontUrl } = await generateUploadUrl(
      user.id,
      fileName,
      contentType
    );

    return NextResponse.json({
      uploadUrl,
      s3Key,
      cloudFrontUrl,
      expiresIn: 15 * 60, // 15 minutes
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

