# Testing the Matching System

Quick guide to test the matching system we just built.

## Step 1: Run Unit Tests ✅

```bash
npm test src/lib/matching/__tests__/algorithm.test.ts
```

Expected: All 27 tests passing ✅

---

## Step 2: Apply Database Migration

The matching system needs PostGIS functions in your Supabase database.

### Option A: Via Supabase Dashboard (Easiest)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy/paste the contents of:
   ```
   supabase/migrations/202411240001_create_matching_functions.sql
   ```
5. Click **Run**

### Option B: Via Supabase CLI

```bash
# If you have supabase CLI installed
supabase db push

# Or apply specific migration
supabase db execute --file supabase/migrations/202411240001_create_matching_functions.sql
```

---

## Step 3: Set Environment Variables

Make sure your `.env.local` has:

```bash
# These you already have
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# NEW: Service role key (needed for API routes)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NEW: Cron job security (for batch generation)
CRON_SECRET=any_random_string_here
```

**To get your Service Role Key:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the `service_role` key (secret, don't expose to frontend!)

---

## Step 4: Create Test Data

You need users with:
- Complete profiles (`is_profile_complete = true`)
- Location data (latitude, longitude, zipcode)
- Hobbies selected

### Quick SQL to Check Your Data:

```sql
-- Check if you have eligible users
SELECT 
  id, 
  full_name, 
  is_profile_complete,
  latitude,
  longitude,
  age
FROM users 
WHERE is_profile_complete = true 
  AND latitude IS NOT NULL 
  AND longitude IS NOT NULL;

-- Check hobbies for a user
SELECT 
  uh.preference_rank,
  h.name,
  h.category
FROM user_hobbies uh
JOIN hobbies h ON h.id = uh.hobby_id
WHERE uh.user_id = 'YOUR_USER_ID'
ORDER BY uh.preference_rank;
```

### If You Don't Have Test Data:

Create 2-3 test users with:
1. Complete signup flow
2. Complete profile setup (photos, hobbies, bio)
3. Different locations but within ~50 miles
4. Some overlapping hobbies

---

## Step 5: Test Individual Match Generation

### Start Dev Server:
```bash
npm run dev
```

### Test the API Endpoint:

```bash
# Replace YOUR_USER_ID with an actual user ID from your database
curl -X POST http://localhost:3000/api/matches/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "force": true
  }'
```

### Expected Response:
```json
{
  "success": true,
  "result": {
    "userId": "...",
    "matchesGenerated": 2,
    "matches": [
      {
        "matchedUserId": "...",
        "similarityScore": 0.85,
        "breakdown": {
          "hobby": 0.90,
          "location": 0.75,
          "activity": 1.0
        }
      }
    ]
  }
}
```

### Common Issues:

**"No potential matches found"**
- Need more users in database
- Check users have overlapping hobbies
- Check users are within distance radius

**"User profile not found or incomplete"**
- User's `is_profile_complete` is false
- User doesn't have latitude/longitude set

**"Missing Supabase environment variables"**
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- Restart dev server

---

## Step 6: Check Database for Stored Matches

After running match generation, check if matches were stored:

```sql
-- View all matches
SELECT 
  m.*,
  u1.full_name as user1_name,
  u2.full_name as user2_name
FROM matches m
JOIN users u1 ON u1.id = m.user_1_id
JOIN users u2 ON u2.id = m.user_2_id
ORDER BY m.created_at DESC
LIMIT 10;

-- Check matches for specific user
SELECT 
  m.*,
  CASE 
    WHEN m.user_1_id = 'YOUR_USER_ID' THEN u2.full_name
    ELSE u1.full_name
  END as matched_with
FROM matches m
JOIN users u1 ON u1.id = m.user_1_id
JOIN users u2 ON u2.id = m.user_2_id
WHERE m.user_1_id = 'YOUR_USER_ID' 
   OR m.user_2_id = 'YOUR_USER_ID'
ORDER BY m.created_at DESC;
```

---

## Step 7: Test Batch Generation Status

Check how many users need matches:

```bash
curl http://localhost:3000/api/matches/batch-generate
```

Expected response:
```json
{
  "currentWeek": "2025-W47",
  "usersNeedingMatches": 5,
  "matchesGeneratedThisWeek": 0,
  "ready": true
}
```

---

## Step 8: Test Batch Generation (Optional)

**⚠️ Warning:** This will generate matches for ALL users

```bash
curl -X POST http://localhost:3000/api/matches/batch-generate \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Replace `YOUR_CRON_SECRET` with the value from your `.env.local`

---

## Step 9: Verify PostGIS Functions Work

Test the geographic filtering directly:

```sql
-- Test get_match_candidates function
-- Replace with actual user coordinates
SELECT * FROM get_match_candidates(
  'USER_ID_HERE'::uuid,
  -122.4194,  -- longitude (San Francisco example)
  37.7749,    -- latitude
  50000,      -- 50km radius in meters
  25,         -- min age
  35          -- max age
);
```

Should return nearby users with distance calculated.

---

## Quick Testing Checklist

- [ ] Unit tests pass (27/27)
- [ ] Database migration applied successfully
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added to `.env.local`
- [ ] Dev server running
- [ ] Test data: 2+ users with complete profiles
- [ ] Test data: Users have hobbies selected
- [ ] Test data: Users have location data
- [ ] Individual match generation works
- [ ] Matches visible in database
- [ ] Batch status endpoint works

---

## Troubleshooting

### "function get_match_candidates does not exist"
→ Run the database migration (Step 2)

### "Missing Supabase environment variables"
→ Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and restart server

### "No candidates found"
→ Create more test users or increase distance radius

### Vercel Deployment
When deploying to Vercel:
1. Add `SUPABASE_SERVICE_ROLE_KEY` to environment variables
2. Add `CRON_SECRET` to environment variables
3. Cron will run automatically every Monday at 3 AM UTC

---

**Need Help?**
- Check browser console for errors
- Check terminal/server logs
- Verify Supabase project is running
- Check PostGIS extension is enabled in Supabase

