# Quick Start: Seeding Test Users

This guide will help you quickly seed 100 test users into your database.

## Step 1: Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy this to .env.local and fill in your values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Where to find these values:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep this secret!

## Step 2: Seed Hobbies (First Time Only)

The test users need hobbies to be in the database first.

**Option A: Via Browser**
1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/seed-hobbies`

**Option B: Via curl**
```bash
curl -X POST http://localhost:3000/api/seed-hobbies
```

You should see a response like:
```json
{
  "message": "Successfully inserted 30 hobbies",
  "count": 30
}
```

## Step 3: Run the Seeding Script

```bash
npm run seed:test-users
```

This will:
- ✅ Create 100 users in Seattle area
- ✅ Assign 3-7 hobbies to each user
- ✅ Set up realistic profiles with ages 21-65
- ✅ Complete in ~30 seconds

Expected output:
```
🌱 Starting test user seeding process...
📚 Fetching hobbies from database...
✅ Found 30 hobbies

🎲 Generating hobby combinations...
✅ Generated 100 unique hobby combinations

👥 Creating users...
✅ Successfully created 100 users

🎯 Assigning hobbies to users...
✅ Successfully assigned hobbies to all users

📊 Summary:
   • Users created: 100
   • Hobby assignments: 450
   • Average hobbies per user: 4.5
   • Location: Seattle, WA area (27 zipcodes)
   • Age range: 21-65 years old

🎉 Test user seeding completed successfully!
```

## Step 4: Verify the Data

Check your Supabase database:

**Via Supabase Dashboard:**
1. Go to **Table Editor** → **users**
2. You should see 100 new users with emails like `test.user1.alex.smith@example.com`

**Via SQL:**
```sql
-- Count test users
SELECT COUNT(*) FROM users WHERE email LIKE 'test.user%@example.com';

-- View sample test users with their hobbies
SELECT 
  u.full_name,
  u.email,
  u.age,
  u.zipcode,
  STRING_AGG(h.name, ', ' ORDER BY uh.preference_rank) as hobbies
FROM users u
LEFT JOIN user_hobbies uh ON u.id = uh.user_id
LEFT JOIN hobbies h ON uh.hobby_id = h.id
WHERE u.email LIKE 'test.user%@example.com'
GROUP BY u.id, u.full_name, u.email, u.age, u.zipcode
LIMIT 10;
```

## Step 5: Test Matching Algorithm

Now that you have test users, you can test the matching algorithm:

```bash
# Generate matches for a specific user
curl -X POST http://localhost:3000/api/matches/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id-here"}'

# Or generate matches for all users (batch)
curl -X POST http://localhost:3000/api/matches/batch-generate
```

## Cleanup

To remove all test users when you're done:

```sql
-- WARNING: This will permanently delete all test users
DELETE FROM users WHERE email LIKE 'test.user%@example.com';
```

## Common Issues

### ❌ "Missing required environment variables"
**Fix**: Make sure `.env.local` exists and contains all three variables

### ❌ "No hobbies found in database"
**Fix**: Run Step 2 first to seed hobbies

### ❌ "Failed to fetch hobbies"
**Fix**: Check that your Supabase project is running and the service role key is correct

### ❌ Script hangs or is very slow
**Fix**: Check your internet connection and Supabase project status at [status.supabase.com](https://status.supabase.com)

## Next Steps

- 📊 Run the matching algorithm: See `TESTING-MATCHING.md`
- 🔍 Explore user profiles in the app
- 📈 Test with different hobby combinations
- 🎯 Analyze matching quality with diverse test data

---

**Need help?** Check the full documentation in `scripts/README.md`

