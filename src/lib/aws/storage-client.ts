/**
 * AWS S3 Storage Client Utilities
 * 
 * Client-side utilities for uploading photos to S3.
 * Uses presigned URLs from the API to upload directly to S3.
 */

interface PresignedUrlResponse {
  uploadUrl: string;
  s3Key: string;
  cloudFrontUrl: string;
  expiresIn: number;
}

interface UploadResult {
  s3Key: string;
  cloudFrontUrl: string;
}

/**
 * Get a presigned URL for uploading a photo
 */
async function getPresignedUrl(
  file: File,
  accessToken: string
): Promise<PresignedUrlResponse> {
  const response = await fetch('/api/photos/presigned-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || 'image/jpeg',
      fileSize: file.size,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get upload URL');
  }

  return response.json();
}

/**
 * Upload a file directly to S3 using a presigned URL
 */
async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'image/jpeg',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to upload to S3: ${response.statusText}`);
  }
}

/**
 * Upload a photo to AWS S3
 * 
 * @param file - The file to upload
 * @param accessToken - The user's Supabase access token
 * @returns The S3 key and CloudFront URL of the uploaded photo
 */
export async function uploadPhotoToS3(
  file: File,
  accessToken: string
): Promise<UploadResult> {
  // Get presigned URL from our API
  const presignedData = await getPresignedUrl(file, accessToken);
  
  // Validate we got the required fields
  if (!presignedData.uploadUrl || !presignedData.s3Key || !presignedData.cloudFrontUrl) {
    throw new Error('Failed to get valid upload URL from server');
  }

  // Upload directly to S3
  await uploadToS3(presignedData.uploadUrl, file);

  return {
    s3Key: presignedData.s3Key,
    cloudFrontUrl: presignedData.cloudFrontUrl,
  };
}

/**
 * Delete photos from S3
 * 
 * @param s3Keys - Array of S3 keys to delete
 * @param accessToken - The user's Supabase access token
 */
export async function deletePhotosFromS3(
  s3Keys: string[],
  accessToken: string
): Promise<void> {
  if (s3Keys.length === 0) return;

  const response = await fetch('/api/photos/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ s3Keys }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete photos');
  }
}


