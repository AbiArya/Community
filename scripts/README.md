# Database Seeding Scripts

This directory contains scripts for seeding test data into the Supabase database.

## Prerequisites

Before running any seeding scripts, ensure you have:

1. **Environment Variables Set Up**
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (with admin privileges)

2. **Hobbies Seeded**
   - Run the seed-hobbies API endpoint first: `POST /api/seed-hobbies`
   - Or visit it in your browser after starting the dev server

3. **Dependencies Installed**
   - Run `npm install` to ensure `tsx` and other dependencies are available

## Scripts

### `seed-test-users.ts`

Creates 100 test users in the Seattle area with various hobby combinations.

### `cleanup-test-users.ts`

Safely removes all test users and their associated data from the database.

**What it does:**
- Creates 100 users with realistic names, ages, and bios
- Assigns each user 3-7 hobbies with different preference rankings
- Places all users in Seattle-area zipcodes (98101-98199)
- Sets proper lat/lng coordinates for geographic matching
- Marks all profiles as complete and ready for matching

**How to run:**

```bash
npm run seed:test-users
```

Or directly with tsx:

```bash
npx tsx scripts/seed-test-users.ts
```

**User Details:**
- **Age range**: 21-65 years old
- **Hobbies per user**: 3-7 hobbies (randomly varied)
- **Location**: 27 different Seattle zipcodes
- **Email format**: `test.user{N}.{firstname}.{lastname}@example.com`
- **Profile completeness**: All profiles marked as complete

**Example Output:**
```
🌱 Starting test user seeding process...

📚 Fetching hobbies from database...
✅ Found 30 hobbies

🎲 Generating hobby combinations...
✅ Generated 100 unique hobby combinations

👥 Creating users...
📝 Prepared 100 users
   ✅ Batch 1/10: Created 10 users
   ...

✅ Successfully created 100 users

🎯 Assigning hobbies to users...
📝 Prepared 450 hobby assignments
   ✅ Batch 1/9: Assigned 50 hobbies
   ...

✅ Successfully assigned hobbies to all users

📊 Summary:
   • Users created: 100
   • Hobby assignments: 450
   • Average hobbies per user: 4.5
   • Location: Seattle, WA area (27 zipcodes)
   • Age range: 21-65 years old

🎉 Test user seeding completed successfully!
```

**Use Cases:**
- Testing the matching algorithm with diverse user profiles
- Populating a development/staging database
- Generating realistic test data for UI development
- Performance testing with a substantial user base

---

### `cleanup-test-users.ts`

**What it does:**
- Finds all test users (emails matching `test.user%@example.com`)
- Shows a preview of users to be deleted
- Asks for confirmation before proceeding
- Deletes all associated data (hobbies, photos, matches)
- Removes the test users from the database
- Verifies successful deletion

**How to run:**

```bash
npm run cleanup:test-users
```

Or directly with tsx:

```bash
npx tsx scripts/cleanup-test-users.ts
```

**Example Output:**
```
🧹 Test User Cleanup Script

📊 Checking for test users...

⚠️  Found 100 test users that will be deleted:

   Sample users:
   - Alex Smith (test.user1.alex.smith@example.com)
   - Jordan Johnson (test.user2.jordan.johnson@example.com)
   - Taylor Williams (test.user3.taylor.williams@example.com)
   - Morgan Brown (test.user4.morgan.brown@example.com)
   - Casey Jones (test.user5.casey.jones@example.com)
   ... and 95 more

⚠️  Are you sure you want to delete these users? This cannot be undone. (yes/no): yes

🗑️  Deleting test users...

   Deleting user hobbies...
   ✅ User hobbies deleted
   Deleting user photos...
   ✅ User photos deleted
   Deleting matches...
   ✅ Matches deleted
   Deleting users...
   ✅ Users deleted

✅ Cleanup completed successfully!
   Deleted 100 test users and all associated data.
```

**Safety Features:**
- ✅ Shows preview before deletion
- ✅ Requires explicit confirmation
- ✅ Only targets test users (safe for production data)
- ✅ Cascading deletion of related data
- ✅ Verification after deletion

---

## Environment Setup

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **Security Note**: Never commit your `.env.local` file or expose your service role key. It has full admin access to your database.

## Troubleshooting

**Error: "No hobbies found in database"**
- Solution: Run the seed-hobbies API endpoint first
- Navigate to `/api/seed-hobbies` in your browser or use curl:
  ```bash
  curl -X POST http://localhost:3000/api/seed-hobbies
  ```

**Error: "Missing required environment variables"**
- Solution: Ensure your `.env.local` file exists and contains both required variables
- Check that you're using the service role key, not the anon key

**Error: "Failed to insert users"**
- Solution: Check your RLS policies in Supabase
- The service role key should bypass RLS, but verify your database permissions

**Slow performance**
- The script processes users in batches of 10
- Total execution time should be 10-30 seconds depending on network speed
- If it's taking longer, check your database connection and Supabase project status

## Future Enhancements

Potential additions to this script:
- Add user photos (placeholder or AI-generated images)
- Support for other metro areas (SF, Portland, NYC, etc.)
- Configurable user count and hobby distribution
- Option to create only specific age groups
- Integration with matching algorithm testing

## Contributing

When adding new seeding scripts:
1. Follow the naming convention: `seed-{resource}.ts`
2. Add comprehensive error handling
3. Include progress logging with emoji indicators
4. Provide a summary at the end
5. Document the script in this README
6. Add a corresponding npm script in `package.json`

