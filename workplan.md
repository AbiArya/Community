# Community Friends App - Development Workplan

## Project Overview
A friend-matching web application that connects users based on shared hobbies and interests. Users create profiles with photos, ranked hobbies, and descriptions, then receive 2 weekly matches of similar people to build their local community.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Storage**: AWS S3 + CloudFront (photos)
- **Compute**: AWS Lambda + EventBridge (weekly cron)
- **Deployment**: Vercel
- **Cost**: $0/month (free tiers)

## Current Focus: Phase 6.3 - Live Chat & Messaging
Match Display UI is complete! Users can now view their matches with beautiful cards, stats dashboard, and weekly grouping. Next: build the messaging system.

## Development Phases

### Phase 1: Foundation & Setup ⏳
**Timeline**: Week 1

#### Milestone 1.1: Project Initialization
- [x] Initialize Next.js 14 project with TypeScript
- [x] Set up Tailwind CSS
- [x] Configure ESLint (flat) and baseline formatting
- [ ] Set up Git repository
- [x] Create basic folder structure (components, hooks, lib)
- [x] Set up Supabase project
- [x] Configure environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

#### Milestone 1.2: Database Schema Design
- [x] Design user profiles table schema
- [x] Design hobbies/interests table schema  
- [x] Design user_hobbies junction table
- [x] Design matches table schema
- [x] Design user_photos table schema
- [x] Create Supabase migration files
- [x] Set up Row Level Security (RLS) policies

### Phase 2: Authentication System ⏳
**Timeline**: Week 1-2

#### Milestone 2.1: Auth Infrastructure
- [x] Install and configure Supabase client for email auth
- [x] Enable email auth (magic link) in Supabase
- [x] Create basic hook for auth session (`useAuthSession`)
- [x] Implement protected route logic (client-side guard)
- [x] Create auth utilities and types (email validator)

#### Milestone 2.2: Login/Signup Pages
- [x] Design login page UI (email input)
- [x] Design signup page UI (email + magic link)
- [x] Implement email authentication (magic link)
- [x] Add form validation for email
- [x] Add loading states and error handling
- [x] Test email authentication flow

### Phase 3: Core Pages & Navigation ⏳
**Timeline**: Week 2-3

#### Milestone 3.1: Landing Page
- [x] Design hero section
- [x] Create features showcase
- [x] Add call-to-action buttons
- [x] Implement responsive design
- [x] Add smooth scrolling navigation
- [x] Optimize for SEO

#### Milestone 3.2: Navigation & Layout
- [x] Create main navigation component
- [x] Implement protected layout wrapper (client guard used on protected pages)
- [x] Add mobile-responsive menu
- [x] Create footer component
- [x] Add route transitions

### Phase 4: Profile Management ⏳
**Timeline**: Week 3-4

#### Milestone 4.1: Profile Creation Flow
- [x] Design profile setup wizard
- [x] Create photo upload component (2-3 photos, 2MB max)
- [x] Implement hobby selection interface (predefined list only)
- [x] Add hobby ranking/ordering functionality
- [x] Create description text area
- [x] Add basic matching preferences (age range, distance)
- [x] Add form validation and progress tracking
- [x] Redirect `/profile` to `/profile/setup` when profile incomplete
- [x] Complete Profile action sets `is_profile_complete = true` and saves bio/preferences

#### Milestone 4.2: Profile Display & Editing
- [x] Design profile view page
- [x] Implement profile editing interface
- [x] Add photo management (add/remove/reorder)
- [x] Create hobby editing with up/down ranking
- [x] Add profile preview functionality

### Phase 5: Settings & Account Management ⏳
**Timeline**: Week 4

#### Milestone 5.1: Settings Page
- [x] Create account settings interface
- [x] Add age range and distance preferences
- [x] Create account deletion option
- Note: Match frequency is fixed at 2 per week (not user-configurable)
- Note: Phone numbers not collected (in-app messaging implemented in Phase 6.3)

#### Milestone 5.2: UI Refresh & Theming ✅
- [x] Run full UI audit to catalog visual inconsistencies and usability gaps
- [x] Define updated color palette, typography scale, and spacing tokens
- [x] Create reusable Tailwind theme tokens and component variants that match the refreshed look
- [x] Update existing pages (landing, profile, settings, matches) to the unified theme
- [x] Add lightweight style guide that documents patterns/components for future features
- [x] Validate refreshed UI on mobile + desktop to ensure parity

### Phase 6: Matching Algorithm & System ⏳
**Timeline**: Week 5-6

#### Milestone 6.1: Matching Logic ✅
- [x] Design similarity scoring algorithm
- [x] Implement hobby-based matching
- [x] Add geographic proximity filtering
- [x] Create match generation cron job
- [x] Set up weekly match scheduling

#### Milestone 6.2: Match Display & Interaction
- [x] Design match cards interface (view-only)
- [x] Create match history page
- [x] Add match viewing tracking
- [x] Create simple contact display/connection
- [x] Create match statistics dashboard

#### Milestone 6.3: Live Chat & Messaging
- [ ] Design messages table schema
- [ ] Design conversations/threads table schema
- [ ] Add RLS policies for message privacy
- [ ] Create database indexes for query optimization
- [ ] Set up Supabase Realtime subscriptions for messages
- [ ] Configure presence tracking for online/offline status
- [ ] Implement typing indicators
- [ ] Add read receipts tracking
- [ ] Design chat list/inbox page (all conversations)
- [ ] Create conversation thread component (individual chat)
- [ ] Build message composer with emoji support
- [ ] Add image/photo sharing in messages
- [ ] Implement message timestamps and read indicators
- [ ] Design mobile-optimized chat interface
- [ ] Implement sending and receiving text messages
- [ ] Add real-time message updates
- [ ] Add conversation search/filtering
- [ ] Implement message moderation/reporting
- [ ] Add conversation archiving/deletion
- [ ] Add "Start Chat" button on match cards
- [ ] Create unread message badge on navigation
- [ ] Link match profiles to chat threads
- [ ] Add chat history to match details

### Phase 7: Testing & Polish ⏳
**Timeline**: Week 7-8

#### Milestone 7.1: Testing & Bug Fixes
- [ ] Unit test core components
- [ ] Integration test auth flow
- [ ] Test matching algorithm accuracy
- [ ] Cross-browser compatibility testing
- [ ] Mobile responsiveness testing
- [ ] Performance optimization

#### Milestone 7.2: UI/UX Polish
- [ ] Implement loading skeletons
- [ ] Add micro-interactions
- [ ] Optimize image loading
- [ ] Add error boundaries
- [ ] Improve accessibility (WCAG compliance)

### Phase 8: Deployment & Launch ⏳
**Timeline**: Week 9

#### Milestone 8.1: Production Setup
- [ ] Configure Vercel deployment
- [ ] Set up production Supabase environment
- [ ] Configure custom domain
- [ ] Set up analytics (Google Analytics/Plausible)
- [ ] Implement error monitoring (Sentry)

#### Milestone 8.2: Launch Preparation
- [ ] Create user onboarding flow
- [ ] Set up customer support system
- [ ] Create privacy policy and terms of service
- [ ] Final security audit
- [ ] Soft launch with beta users

### Phase 8.5: Visual Rebrand (Friendship Theme) ⏳
**Timeline**: Before Launch (Week 8-9)
**Goal**: Shift from romance-coded visuals to friendship-focused aesthetics.

#### Milestone 8.5.1: Color Palette Overhaul
- [ ] Replace purple/peach palette with friendship-oriented colors (teal, warm indigo, or friendly greens)
- [ ] Update CSS custom properties in globals.css
- [ ] Maintain semantic color tokens (success, error, warning)
- [ ] Test new palette for accessibility (contrast ratios)

#### Milestone 8.5.2: Iconography Update
- [ ] Replace all heart icons with friendship-appropriate alternatives:
  - Hearts → High-fives, handshakes, sparkles, or people icons
  - Compatibility badge icon
  - Page headers and navigation
  - Match cards and stats
- [ ] Update any romantic language/copy throughout the app
- [ ] Audit and refresh illustrations/graphics if any

#### Milestone 8.5.3: Tone & Copy Review
- [ ] Review all user-facing copy for romantic undertones
- [ ] Update microcopy to emphasize friendship, community, connection
- [ ] Refresh landing page messaging to clarify friend-matching purpose

### Phase 9: Community & Group Features ⏳
**Timeline**: Post-Launch

#### Milestone 9.1: Group Chat System (Community Building)
**Core differentiator** - transitioning from 1:1 connections to community groups.
- [ ] Design groups/communities table schema
- [ ] Create group membership and roles schema
- [ ] Add "Merge Chats" functionality to combine 1:1 conversations
- [ ] Design group creation flow (from existing matches)
- [ ] Build group chat UI (extend 1:1 messaging components)
- [ ] Implement group management (add/remove members, admin controls)
- [ ] Add group discovery (find communities based on hobbies/location)
- [ ] Create group activity feed and notifications
- [ ] Design "community health" metrics and engagement features

#### Milestone 9.2: AI/LLM Integration
Practical LLM applications for enhanced user experience (also for learning purposes).

**Infrastructure:**
- [ ] Set up LLM provider integration (OpenAI/Anthropic API)
- [ ] Create prompt templates and evaluation framework
- [ ] Implement caching/rate limiting for cost control

**Features (ordered by complexity):**
- [ ] **Conversation Starters**: Generate personalized icebreakers based on shared hobbies
- [ ] **Match Explanations**: Go beyond scores to explain *why* two people match well
- [ ] **Profile Bio Coach**: Help users write engaging, authentic bios
- [ ] **Smart Moderation**: Content moderation for messages and profiles
- [ ] **Group Formation Suggestions**: Suggest which connections might gel well as a group

#### Milestone 9.3: Chat-Based Activity Recommendations
LLM-powered suggestions based on individual conversation context.
> "You two mentioned grabbing coffee → here are spots near you both"

**Core Flow:**
- [ ] Add "Get Suggestions" button in chat UI
- [ ] Fetch conversation history for that specific chat
- [ ] LLM extracts actionable intent (coffee, concerts, hiking, food, etc.)
- [ ] Query external APIs based on intent + users' locations
- [ ] Display recommendations inline in the chat thread

**External API Integrations:**
- [ ] Yelp/Google Places API (coffee, restaurants, activities)
- [ ] Ticketmaster API (concerts, live events)
- [ ] Eventbrite API (local events, classes, meetups)
- [ ] Handle API keys, rate limits, error handling

**Location Logic:**
- [ ] Calculate midpoint or "convenient for both" locations
- [ ] Use existing user zipcode/lat-long data

**UX Polish:**
- [ ] Shareable recommendation cards (both users see same suggestions)
- [ ] "Save for later" or "Add to plans" functionality
- [ ] Feedback loop: "Was this helpful?" for prompt tuning

### Phase 10: Future Enhancements ⏳
**Timeline**: Post-Launch

#### Milestone 10.1: Data Management & Onboarding
- [ ] Create profile completion tracking
- [ ] Add user onboarding checklist

## Technical Requirements

### Database Schema

#### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  full_name VARCHAR,
  bio TEXT,
  location VARCHAR,  -- Deprecated: use zipcode instead
  zipcode VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_point GEOGRAPHY(POINT, 4326),  -- PostGIS for distance queries
  age INTEGER,
  is_profile_complete BOOLEAN DEFAULT false,
  last_active TIMESTAMP,
  match_frequency INTEGER DEFAULT 2,
  age_range_min INTEGER DEFAULT 18,
  age_range_max INTEGER DEFAULT 100,
  distance_radius INTEGER DEFAULT 50
)
```

#### User Photos Table
```sql
user_photos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  photo_url VARCHAR,
  display_order INTEGER,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP
)
```

#### Hobbies Table
```sql
hobbies (
  id UUID PRIMARY KEY,
  name VARCHAR UNIQUE,
  category VARCHAR,
  created_at TIMESTAMP
)
```

#### User Hobbies Table
```sql
user_hobbies (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  hobby_id UUID REFERENCES hobbies(id),
  preference_rank INTEGER,
  created_at TIMESTAMP
)
```

#### Matches Table
```sql
matches (
  id UUID PRIMARY KEY,
  user_1_id UUID REFERENCES users(id),
  user_2_id UUID REFERENCES users(id),
  similarity_score FLOAT,
  created_at TIMESTAMP,
  match_week VARCHAR, -- '2024-W01'
  is_viewed_by_user_1 BOOLEAN DEFAULT false,
  is_viewed_by_user_2 BOOLEAN DEFAULT false
)
```

#### Conversations Table
```sql
conversations (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_message_at TIMESTAMP,
  last_message_preview TEXT
)
```

#### Messages Table
```sql
messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  content TEXT,
  message_type VARCHAR DEFAULT 'text', -- 'text', 'image', 'system'
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP,
  deleted_by_sender BOOLEAN DEFAULT false,
  deleted_by_receiver BOOLEAN DEFAULT false
)
```

### File Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── profile/
│   │   ├── settings/
│   │   ├── matches/
│   │   └── messages/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── auth/
│   ├── profile/
│   ├── matches/
│   └── messaging/
├── lib/
│   ├── supabase/
│   ├── utils/
│   └── types/
├── hooks/
└── middleware.ts
```

### Key Features Specification

#### Profile System
- **Photo Upload**: 2-3 high-quality photos, automatic compression
- **Hobby Selection**: Choose from predefined list + custom additions
- **Hobby Ranking**: Drag-and-drop interface for preference ordering
- **Bio**: 500 character limit with rich text support
- **Location**: US zipcode-based with PostGIS for accurate distance matching (like Hinge)

#### Matching Algorithm
- **Hobby Similarity**: Weighted scoring based on shared interests and rankings
- **Geographic Proximity**: PostGIS-powered distance matching using zipcodes
- **Weekly Cadence**: 2 matches delivered every Monday
- **Diversity**: Prevent repeated similar matches
- **Mutual Exclusion**: No duplicate matches between users
- **Distance Queries**: Efficient radius-based filtering with spatial indexes

#### User Experience
- **Onboarding**: Step-by-step profile creation with progress tracking
- **Match Cards**: Tinder-style card interface with detailed profiles
- **Messaging**: Real-time chat with matches (Hinge/Tinder-style inbox and conversation threads)
- **Settings**: Granular control over matching preferences

## Current Status

### ✅ Completed (Phases 1-6.2)
| Phase | Status |
|-------|--------|
| 1. Foundation & Setup | ✅ Complete |
| 2. Authentication | ✅ Complete |
| 3. Core Pages & Navigation | ✅ Complete |
| 4. Profile Management | ✅ Complete |
| 5. Settings & Account | ✅ Complete |
| 6.1 Matching Algorithm | ✅ Complete |
| 6.2 Match Display UI | ✅ Complete |

### 📍 Next Up: Phase 6.3 - Messaging
- [ ] Conversations/messages schema
- [ ] Chat UI with Supabase Realtime
- [ ] Read receipts, typing indicators

### 🗺️ Roadmap Preview
| Phase | Description | Status |
|-------|-------------|--------|
| 7. Testing & Polish | Unit tests, cross-browser, performance | ⏳ Pending |
| 8. Deployment & Launch | Vercel, production Supabase, domain | ⏳ Pending |
| 8.5 Visual Rebrand | Friendship-themed colors, icons, copy | ⏳ Pending |
| 9.1 Group Chat System | Merge 1:1 chats → community groups | ⏳ Pending |
| 9.2 AI/LLM Integration | Icebreakers, match explanations, moderation | ⏳ Pending |
| 9.3 Chat Recommendations | LLM extracts intent → suggest places/events | ⏳ Pending |

### Infrastructure (see `AWS-MIGRATION-PLAN.md`)
- **Photos:** AWS S3 + CloudFront
- **Match Generation:** AWS Lambda (runs Mon 3AM UTC)
- **Database/Auth:** Supabase

## Risk Assessment
- **High Risk**: Matching algorithm accuracy and user satisfaction
- **Medium Risk**: Photo upload and storage performance
- **Low Risk**: Basic CRUD operations and authentication

## Success Metrics
- User profile completion rate > 80%
- Match acceptance rate > 30%
- Weekly active users retention > 60%
- Average session duration > 5 minutes

---
*Last Updated*: 2025-12-04
*Status*: Phase 6.2 Complete - Ready for Messaging (6.3)