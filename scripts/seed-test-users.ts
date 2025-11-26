/**
 * Script to seed 100 test users in the Seattle area with various hobby combinations
 * Run with: npx tsx scripts/seed-test-users.ts
 * 
 * Requirements:
 * - SUPABASE_SERVICE_ROLE_KEY environment variable set in .env.local
 * - tsx installed: npm install -D tsx
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/lib/supabase/types';

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

// Seattle area zipcodes
const SEATTLE_ZIPCODES = [
  { zip: '98101', lat: 47.6097, lng: -122.3331, city: 'Seattle' },
  { zip: '98102', lat: 47.6311, lng: -122.3222, city: 'Seattle' },
  { zip: '98103', lat: 47.6694, lng: -122.3417, city: 'Seattle' },
  { zip: '98104', lat: 47.6038, lng: -122.3301, city: 'Seattle' },
  { zip: '98105', lat: 47.6625, lng: -122.3028, city: 'Seattle' },
  { zip: '98106', lat: 47.5317, lng: -122.3542, city: 'Seattle' },
  { zip: '98107', lat: 47.6686, lng: -122.3761, city: 'Seattle' },
  { zip: '98108', lat: 47.5428, lng: -122.3128, city: 'Seattle' },
  { zip: '98109', lat: 47.6356, lng: -122.3478, city: 'Seattle' },
  { zip: '98112', lat: 47.6308, lng: -122.2961, city: 'Seattle' },
  { zip: '98115', lat: 47.6858, lng: -122.3031, city: 'Seattle' },
  { zip: '98116', lat: 47.5717, lng: -122.3928, city: 'Seattle' },
  { zip: '98117', lat: 47.6864, lng: -122.3756, city: 'Seattle' },
  { zip: '98118', lat: 47.5450, lng: -122.2753, city: 'Seattle' },
  { zip: '98119', lat: 47.6381, lng: -122.3678, city: 'Seattle' },
  { zip: '98121', lat: 47.6147, lng: -122.3450, city: 'Seattle' },
  { zip: '98122', lat: 47.6097, lng: -122.3014, city: 'Seattle' },
  { zip: '98125', lat: 47.7186, lng: -122.2981, city: 'Seattle' },
  { zip: '98126', lat: 47.5450, lng: -122.3764, city: 'Seattle' },
  { zip: '98133', lat: 47.7353, lng: -122.3444, city: 'Seattle' },
  { zip: '98134', lat: 47.5806, lng: -122.3250, city: 'Seattle' },
  { zip: '98136', lat: 47.5431, lng: -122.3856, city: 'Seattle' },
  { zip: '98144', lat: 47.5808, lng: -122.2983, city: 'Seattle' },
  { zip: '98146', lat: 47.4972, lng: -122.3544, city: 'Seattle' },
  { zip: '98177', lat: 47.7444, lng: -122.3731, city: 'Seattle' },
  { zip: '98178', lat: 47.4939, lng: -122.2450, city: 'Seattle' },
  { zip: '98199', lat: 47.6469, lng: -122.3978, city: 'Seattle' },
];

// First and last names for generating realistic names
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
  'Skylar', 'Dakota', 'Rowan', 'Sage', 'River', 'Phoenix', 'Cameron', 'Drew',
  'Jamie', 'Kai', 'Reese', 'Sam', 'Blake', 'Charlie', 'Finley', 'Harper',
  'Hayden', 'Logan', 'Parker', 'Peyton', 'Rory', 'Sawyer', 'Spencer', 'Tatum',
  'Emery', 'Lennon', 'Marley', 'Oakley', 'Paxton', 'Remington', 'Teagan', 'Winter',
  'Arden', 'Bay', 'Bellamy', 'Briar', 'Eden', 'Ellis', 'Gray', 'Jules',
  'Kendall', 'Lane', 'Marlow', 'Monroe', 'Nico', 'Nova', 'Ocean', 'Onyx',
  'Poet', 'Rain', 'Scout', 'Shay', 'Storm', 'True', 'West', 'Wren',
  'Ari', 'Blue', 'Demi', 'Ezra', 'Fox', 'Indigo', 'Juno', 'Koda',
  'Lark', 'Lake', 'Lyric', 'Mars', 'Navy', 'North', 'Paz', 'Quill',
  'Reed', 'Royal', 'Silver', 'Skyler', 'Star', 'Story', 'Sunny', 'Vale',
  'Echo', 'Leaf', 'Meadow', 'Moon', 'Rain', 'Robin', 'Sky', 'Snow',
  'Timber', 'Vale', 'Winter', 'Wolf',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
  'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
];

// Bio templates for variety
const BIO_TEMPLATES = [
  "Just moved to Seattle and looking to make new friends! I love exploring the city and trying new things.",
  "Seattle native who enjoys outdoor adventures and good coffee. Always up for discovering hidden gems around town.",
  "Tech professional by day, adventure seeker by night. Let's grab coffee or hit the trails!",
  "Passionate about making connections with like-minded people. Love a good conversation over brunch.",
  "New to the area and excited to meet new people. Big fan of local music and food scene.",
  "Life-long learner always looking for new experiences. Let's explore what Seattle has to offer!",
  "Balancing work and play in the PNW. Love staying active and trying new restaurants.",
  "Coffee enthusiast and amateur photographer. Always looking for new friends to explore with.",
  "Weekend warrior who loves hiking, good food, and even better company.",
  "Friendly neighbor looking to expand my social circle. Love game nights and outdoor activities.",
  "Curious soul who believes the best experiences are shared with good people.",
  "Always up for trying something new! From food to activities, I'm game.",
  "Seattle transplant looking to build community and make lasting friendships.",
  "Believer in quality time and quality coffee. Let's connect!",
  "Creative spirit who loves art, nature, and meeting interesting people.",
];

// Hobby list (matches the seed-hobbies route)
const HOBBIES = [
  "Running", "Hiking", "Cycling", "Photography", "Cooking",
  "Painting", "Reading", "Gaming", "Coding", "Board Games",
  "Yoga", "Music", "Gardening", "Swimming", "Dancing",
  "Traveling", "Writing", "Meditation", "Volunteering", "Learning Languages",
  "Fishing", "Rock Climbing", "Skiing", "Surfing", "Chess",
  "Podcasting", "Film Making", "Pottery", "Knitting", "Woodworking",
];

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Generate unique hobby combinations for each user
function generateHobbyCombinations(count: number): string[][] {
  const combinations: string[][] = [];
  const shuffledHobbies = shuffleArray(HOBBIES);
  
  for (let i = 0; i < count; i++) {
    // Each user gets 3-7 hobbies
    const hobbyCount = randomInt(3, 7);
    
    // Use different starting points in the shuffled array for variety
    const startIndex = (i * 3) % HOBBIES.length;
    const userHobbies: string[] = [];
    
    for (let j = 0; j < hobbyCount; j++) {
      const hobbyIndex = (startIndex + j) % HOBBIES.length;
      userHobbies.push(shuffledHobbies[hobbyIndex]);
    }
    
    // Shuffle the hobbies for this user to vary the preference order
    combinations.push(shuffleArray(userHobbies));
  }
  
  return combinations;
}

// Main seeding function
async function seedTestUsers() {
  console.log('🌱 Starting test user seeding process...\n');
  
  try {
    // Step 1: Fetch all hobbies from the database
    console.log('📚 Fetching hobbies from database...');
    const { data: hobbiesData, error: hobbiesError } = await supabase
      .from('hobbies')
      .select('id, name')
      .order('name');
    
    if (hobbiesError) {
      throw new Error(`Failed to fetch hobbies: ${hobbiesError.message}`);
    }
    
    if (!hobbiesData || hobbiesData.length === 0) {
      throw new Error('No hobbies found in database. Please run the seed-hobbies API first.');
    }
    
    console.log(`✅ Found ${hobbiesData.length} hobbies\n`);
    
    // Create a map of hobby name to ID
    const hobbyMap = new Map(hobbiesData.map(h => [h.name, h.id]));
    
    // Step 2: Generate hobby combinations
    console.log('🎲 Generating hobby combinations...');
    const hobbyCombinations = generateHobbyCombinations(100);
    console.log(`✅ Generated 100 unique hobby combinations\n`);
    
    // Step 3: Create users
    console.log('👥 Creating users...');
    const usersToCreate = [];
    const usedEmails = new Set<string>();
    
    for (let i = 0; i < 100; i++) {
      const firstName = randomElement(FIRST_NAMES);
      const lastName = randomElement(LAST_NAMES);
      const email = `test.user${i + 1}.${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
      
      // Ensure unique emails
      if (usedEmails.has(email)) {
        continue;
      }
      usedEmails.add(email);
      
      const location = randomElement(SEATTLE_ZIPCODES);
      const age = randomInt(21, 65);
      const bio = randomElement(BIO_TEMPLATES);
      
      usersToCreate.push({
        email,
        full_name: `${firstName} ${lastName}`,
        age,
        bio,
        zipcode: location.zip,
        latitude: location.lat,
        longitude: location.lng,
        is_profile_complete: true,
        age_range_min: Math.max(18, age - 10),
        age_range_max: Math.min(100, age + 10),
        distance_radius: randomInt(10, 50),
        match_frequency: 2,
      });
    }
    
    console.log(`📝 Prepared ${usersToCreate.length} users`);
    
    // Insert users in batches
    const BATCH_SIZE = 10;
    const createdUsers = [];
    
    for (let i = 0; i < usersToCreate.length; i += BATCH_SIZE) {
      const batch = usersToCreate.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from('users')
        .insert(batch)
        .select('id, email, full_name');
      
      if (error) {
        console.error(`❌ Error inserting users batch ${i / BATCH_SIZE + 1}:`, error);
        continue;
      }
      
      if (data) {
        createdUsers.push(...data);
        console.log(`   ✅ Batch ${i / BATCH_SIZE + 1}/${Math.ceil(usersToCreate.length / BATCH_SIZE)}: Created ${data.length} users`);
      }
    }
    
    console.log(`\n✅ Successfully created ${createdUsers.length} users\n`);
    
    // Step 4: Assign hobbies to users
    console.log('🎯 Assigning hobbies to users...');
    const userHobbiesToCreate = [];
    
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const userHobbies = hobbyCombinations[i];
      
      for (let rank = 0; rank < userHobbies.length; rank++) {
        const hobbyName = userHobbies[rank];
        const hobbyId = hobbyMap.get(hobbyName);
        
        if (hobbyId) {
          userHobbiesToCreate.push({
            user_id: user.id,
            hobby_id: hobbyId,
            preference_rank: rank + 1,
          });
        }
      }
    }
    
    console.log(`📝 Prepared ${userHobbiesToCreate.length} hobby assignments`);
    
    // Insert user hobbies in batches
    for (let i = 0; i < userHobbiesToCreate.length; i += BATCH_SIZE * 5) {
      const batch = userHobbiesToCreate.slice(i, i + BATCH_SIZE * 5);
      const { error } = await supabase
        .from('user_hobbies')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Error inserting hobbies batch ${i / (BATCH_SIZE * 5) + 1}:`, error);
        continue;
      }
      
      console.log(`   ✅ Batch ${Math.floor(i / (BATCH_SIZE * 5)) + 1}/${Math.ceil(userHobbiesToCreate.length / (BATCH_SIZE * 5))}: Assigned ${batch.length} hobbies`);
    }
    
    console.log(`\n✅ Successfully assigned hobbies to all users\n`);
    
    // Step 5: Summary
    console.log('📊 Summary:');
    console.log(`   • Users created: ${createdUsers.length}`);
    console.log(`   • Hobby assignments: ${userHobbiesToCreate.length}`);
    console.log(`   • Average hobbies per user: ${(userHobbiesToCreate.length / createdUsers.length).toFixed(1)}`);
    console.log(`   • Location: Seattle, WA area (${SEATTLE_ZIPCODES.length} zipcodes)`);
    console.log(`   • Age range: 21-65 years old`);
    console.log('\n🎉 Test user seeding completed successfully!\n');
    
    // Show sample users
    console.log('📋 Sample users created:');
    for (let i = 0; i < Math.min(5, createdUsers.length); i++) {
      const user = createdUsers[i];
      const userHobbies = hobbyCombinations[i];
      console.log(`   ${i + 1}. ${user.full_name} (${user.email})`);
      console.log(`      Hobbies: ${userHobbies.join(', ')}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error seeding test users:', error);
    process.exit(1);
  }
}

// Run the script
seedTestUsers();
