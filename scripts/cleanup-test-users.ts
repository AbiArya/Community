/**
 * Script to remove all test users created by the seed-test-users script
 * Run with: npx tsx scripts/cleanup-test-users.ts
 * 
 * Requirements:
 * - SUPABASE_SERVICE_ROLE_KEY environment variable set in .env.local
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/lib/supabase/types';
import * as readline from 'readline';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client (bypasses RLS)
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to ask for confirmation
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function cleanupTestUsers() {
  console.log('🧹 Test User Cleanup Script\n');
  
  try {
    // Step 1: Count test users
    console.log('📊 Checking for test users...');
    const { data: testUsers, error: countError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .like('email', 'test.user%@example.com');
    
    if (countError) {
      throw new Error(`Failed to fetch test users: ${countError.message}`);
    }
    
    if (!testUsers || testUsers.length === 0) {
      console.log('✅ No test users found. Database is clean!\n');
      return;
    }
    
    console.log(`\n⚠️  Found ${testUsers.length} test users that will be deleted:\n`);
    
    // Show a sample of users that will be deleted
    const sampleSize = Math.min(5, testUsers.length);
    console.log('   Sample users:');
    for (let i = 0; i < sampleSize; i++) {
      console.log(`   - ${testUsers[i].full_name} (${testUsers[i].email})`);
    }
    if (testUsers.length > sampleSize) {
      console.log(`   ... and ${testUsers.length - sampleSize} more\n`);
    } else {
      console.log();
    }
    
    // Step 2: Ask for confirmation
    const confirmed = await askConfirmation('⚠️  Are you sure you want to delete these users? This cannot be undone. (yes/no): ');
    
    if (!confirmed) {
      console.log('\n❌ Cleanup cancelled. No users were deleted.\n');
      return;
    }
    
    console.log('\n🗑️  Deleting test users...\n');
    
    // Step 3: Delete associated data first (user_hobbies, user_photos, matches)
    console.log('   Deleting user hobbies...');
    const { error: hobbiesError } = await supabase
      .from('user_hobbies')
      .delete()
      .in('user_id', testUsers.map(u => u.id));
    
    if (hobbiesError) {
      console.error(`   ⚠️  Warning: Error deleting user hobbies: ${hobbiesError.message}`);
    } else {
      console.log('   ✅ User hobbies deleted');
    }
    
    console.log('   Deleting user photos...');
    const { error: photosError } = await supabase
      .from('user_photos')
      .delete()
      .in('user_id', testUsers.map(u => u.id));
    
    if (photosError) {
      console.error(`   ⚠️  Warning: Error deleting user photos: ${photosError.message}`);
    } else {
      console.log('   ✅ User photos deleted');
    }
    
    console.log('   Deleting matches...');
    const { error: matchesError } = await supabase
      .from('matches')
      .delete()
      .or(`user_1_id.in.(${testUsers.map(u => u.id).join(',')}),user_2_id.in.(${testUsers.map(u => u.id).join(',')})`);
    
    if (matchesError) {
      console.error(`   ⚠️  Warning: Error deleting matches: ${matchesError.message}`);
    } else {
      console.log('   ✅ Matches deleted');
    }
    
    // Step 4: Delete users
    console.log('   Deleting users...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .like('email', 'test.user%@example.com');
    
    if (usersError) {
      throw new Error(`Failed to delete users: ${usersError.message}`);
    }
    
    console.log('   ✅ Users deleted\n');
    
    // Step 5: Verify deletion
    const { data: remainingUsers, error: verifyError } = await supabase
      .from('users')
      .select('id')
      .like('email', 'test.user%@example.com');
    
    if (verifyError) {
      console.error(`⚠️  Warning: Could not verify deletion: ${verifyError.message}`);
    } else if (remainingUsers && remainingUsers.length === 0) {
      console.log('✅ Cleanup completed successfully!');
      console.log(`   Deleted ${testUsers.length} test users and all associated data.\n`);
    } else {
      console.log(`⚠️  Cleanup partially complete. ${remainingUsers?.length || 0} users remain.\n`);
    }
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the script
cleanupTestUsers();

