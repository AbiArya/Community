"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseAdminAsync = getSupabaseAdminAsync;
exports.getSupabaseAdmin = getSupabaseAdmin;
exports.resetSupabaseClient = resetSupabaseClient;
const supabase_js_1 = require("@supabase/supabase-js");
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
// Singleton client and credentials cache
let supabaseClient = null;
let cachedCredentials = null;
// Secrets Manager client (reused across invocations)
const secretsManager = new client_secrets_manager_1.SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
/**
 * Fetch Supabase credentials from AWS Secrets Manager
 */
async function getSupabaseCredentials() {
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
        const command = new client_secrets_manager_1.GetSecretValueCommand({
            SecretId: secretName,
        });
        const response = await secretsManager.send(command);
        if (!response.SecretString) {
            throw new Error('Secret value is empty');
        }
        const secrets = JSON.parse(response.SecretString);
        if (!secrets.SUPABASE_URL || !secrets.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Secret is missing required fields (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
        }
        cachedCredentials = {
            url: secrets.SUPABASE_URL,
            key: secrets.SUPABASE_SERVICE_ROLE_KEY,
        };
        console.log('Successfully retrieved Supabase credentials from Secrets Manager');
        return cachedCredentials;
    }
    catch (error) {
        console.error('Failed to fetch Supabase credentials from Secrets Manager:', error);
        throw new Error(`Failed to get Supabase credentials. ` +
            `Either set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables, ` +
            `or create a secret named "${secretName}" in AWS Secrets Manager.`);
    }
}
/**
 * Get Supabase admin client for Lambda functions
 * Uses singleton pattern to reuse connection across invocations
 *
 * @returns Promise<SupabaseClientType> - Supabase client instance
 */
async function getSupabaseAdminAsync() {
    if (supabaseClient) {
        return supabaseClient;
    }
    const credentials = await getSupabaseCredentials();
    supabaseClient = (0, supabase_js_1.createClient)(credentials.url, credentials.key, {
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
function getSupabaseAdmin() {
    if (supabaseClient) {
        return supabaseClient;
    }
    // Try environment variables for synchronous access
    const envUrl = process.env.SUPABASE_URL;
    const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!envUrl || !envKey) {
        throw new Error('Supabase credentials not available synchronously. ' +
            'Use getSupabaseAdminAsync() first, or set environment variables.');
    }
    supabaseClient = (0, supabase_js_1.createClient)(envUrl, envKey, {
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
function resetSupabaseClient() {
    supabaseClient = null;
    cachedCredentials = null;
}
