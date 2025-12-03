/**
 * Shared Supabase Client for Lambda Functions
 * 
 * Provides a server-side Supabase client using service role key
 * for admin operations in Lambda functions.
 * 
 * Supports two modes:
 * 1. Environment variables (for local development)
 * 2. AWS Secrets Manager (for Lambda - more secure)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  SecretsManagerClient, 
  GetSecretValueCommand 
} from '@aws-sdk/client-secrets-manager';

// Use generic SupabaseClient type for flexibility
// The Lambda has been tested and works - these types are for IDE support only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseClientType = SupabaseClient<any, 'public', any>;

// Singleton client and credentials cache
let supabaseClient: SupabaseClientType | null = null;
let cachedCredentials: { url: string; key: string } | null = null;

// Secrets Manager client (reused across invocations)
const secretsManager = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

interface SupabaseSecrets {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

/**
 * Fetch Supabase credentials from AWS Secrets Manager
 */
async function getSupabaseCredentials(): Promise<{ url: string; key: string }> {
  // Return cached credentials if available
  if (cachedCredentials) {
    return cachedCredentials;
  }

  // First, check environment variables (for local development)
  const envUrl = process.env.SUPABASE_URL;
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (envUrl && envKey) {
    console.log('Using Supabase credentials from environment variables');
    cachedCredentials = { url: envUrl, key: envKey };
    return cachedCredentials;
  }

  // Fetch from Secrets Manager
  const secretName = process.env.SUPABASE_SECRET_NAME || 'community-app/supabase-dev';
  
  console.log(`Fetching Supabase credentials from Secrets Manager: ${secretName}`);

  try {
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await secretsManager.send(command);
    
    if (!response.SecretString) {
      throw new Error('Secret value is empty');
    }

    const secrets: SupabaseSecrets = JSON.parse(response.SecretString);

    if (!secrets.SUPABASE_URL || !secrets.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Secret is missing required fields (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    }

    cachedCredentials = {
      url: secrets.SUPABASE_URL,
      key: secrets.SUPABASE_SERVICE_ROLE_KEY,
    };

    console.log('Successfully retrieved Supabase credentials from Secrets Manager');
    return cachedCredentials;

  } catch (error) {
    console.error('Failed to fetch Supabase credentials from Secrets Manager:', error);
    throw new Error(
      `Failed to get Supabase credentials. ` +
      `Either set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables, ` +
      `or create a secret named "${secretName}" in AWS Secrets Manager.`
    );
  }
}

/**
 * Get Supabase admin client for Lambda functions
 * Uses singleton pattern to reuse connection across invocations
 * 
 * @returns Promise<SupabaseClientType> - Supabase client instance
 */
export async function getSupabaseAdminAsync(): Promise<SupabaseClientType> {
  if (supabaseClient) {
    return supabaseClient;
  }

  const credentials = await getSupabaseCredentials();

  supabaseClient = createClient(credentials.url, credentials.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

/**
 * Get Supabase admin client (synchronous version)
 * Only works if credentials are already cached (after first async call)
 * or if environment variables are set.
 * 
 * @throws Error if credentials not available
 */
export function getSupabaseAdmin(): SupabaseClientType {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Try environment variables for synchronous access
  const envUrl = process.env.SUPABASE_URL;
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!envUrl || !envKey) {
    throw new Error(
      'Supabase credentials not available synchronously. ' +
      'Use getSupabaseAdminAsync() first, or set environment variables.'
    );
  }

  supabaseClient = createClient(envUrl, envKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  cachedCredentials = { url: envUrl, key: envKey };

  return supabaseClient;
}

/**
 * Reset the client (useful for testing)
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
  cachedCredentials = null;
}
