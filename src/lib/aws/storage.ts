/**
 * AWS S3 Storage Utilities
 * 
 * Server-side utilities for S3 photo storage.
 * Used by API routes to generate presigned URLs and delete photos.
 * 
 * Architecture:
 * - Photos are uploaded directly to S3 from the client using presigned URLs
 * - Photos are served via CloudFront CDN
 * - Photo metadata (S3 key, CloudFront URL) is stored in Supabase `user_photos` table
 */

import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fromIni } from '@aws-sdk/credential-provider-ini';

// S3 bucket and CloudFront configuration from environment
const S3_BUCKET = process.env.AWS_S3_PHOTOS_BUCKET;
const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_PROFILE = process.env.AWS_PROFILE;

// Presigned URL expiration times
const UPLOAD_URL_EXPIRY_SECONDS = 15 * 60; // 15 minutes for upload

/**
 * Get configured S3 client
 * 
 * In production (Lambda), uses IAM role credentials automatically.
 * In development, uses AWS profile credentials.
 */
function getS3Client(): S3Client {
  // In development with a profile, use fromIni to load credentials
  if (AWS_PROFILE) {
    return new S3Client({
      region: AWS_REGION,
      credentials: fromIni({ profile: AWS_PROFILE }),
    });
  }
  
  // In production or with env vars, let SDK auto-resolve
  return new S3Client({
    region: AWS_REGION,
  });
}

/**
 * Check if AWS S3 storage is configured
 */
export function isS3Configured(): boolean {
  return Boolean(S3_BUCKET && CLOUDFRONT_DOMAIN);
}

/**
 * Generate a unique S3 key for a user's photo
 * 
 * Format: photos/{userId}/{timestamp}-{randomId}.{extension}
 */
export function generatePhotoKey(userId: string, fileName: string): string {
  const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  return `photos/${userId}/${timestamp}-${randomId}.${fileExt}`;
}

/**
 * Get CloudFront URL for a photo
 */
export function getCloudFrontUrl(s3Key: string): string {
  if (!CLOUDFRONT_DOMAIN) {
    throw new Error('AWS_CLOUDFRONT_DOMAIN is not configured');
  }
  return `https://${CLOUDFRONT_DOMAIN}/${s3Key}`;
}

/**
 * Generate a presigned URL for uploading a photo
 * 
 * @param userId - The user's ID (used in the S3 key path)
 * @param fileName - Original filename (used for extension)
 * @param contentType - MIME type of the file
 * @returns Object containing presigned URL, S3 key, and final CloudFront URL
 */
export async function generateUploadUrl(
  userId: string,
  fileName: string,
  contentType: string
): Promise<{
  uploadUrl: string;
  s3Key: string;
  cloudFrontUrl: string;
}> {
  if (!S3_BUCKET) {
    throw new Error('AWS_S3_PHOTOS_BUCKET is not configured');
  }

  const s3Client = getS3Client();
  const s3Key = generatePhotoKey(userId, fileName);

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    ContentType: contentType,
    // Optional: Add metadata
    Metadata: {
      'user-id': userId,
      'original-filename': fileName,
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
  });

  return {
    uploadUrl,
    s3Key,
    cloudFrontUrl: getCloudFrontUrl(s3Key),
  };
}

/**
 * Delete multiple photos from S3
 * 
 * @param s3Keys - Array of S3 keys to delete
 */
export async function deletePhotos(s3Keys: string[]): Promise<void> {
  if (!S3_BUCKET || s3Keys.length === 0) {
    return;
  }

  const s3Client = getS3Client();

  // S3 delete objects can handle up to 1000 keys at a time
  const BATCH_SIZE = 1000;
  for (let i = 0; i < s3Keys.length; i += BATCH_SIZE) {
    const batch = s3Keys.slice(i, i + BATCH_SIZE);
    
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: S3_BUCKET,
        Delete: {
          Objects: batch.map(key => ({ Key: key })),
          Quiet: true,
        },
      })
    );
  }
}

/**
 * Validate that a content type is an acceptable image type
 */
export function isValidImageType(contentType: string): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ];
  return validTypes.includes(contentType.toLowerCase());
}


