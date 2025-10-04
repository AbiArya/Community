import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const PREDEFINED_HOBBIES = [
  { name: "Running", category: "Sports & Fitness" },
  { name: "Hiking", category: "Outdoor Activities" },
  { name: "Cycling", category: "Sports & Fitness" },
  { name: "Photography", category: "Arts & Creative" },
  { name: "Cooking", category: "Food & Drink" },
  { name: "Painting", category: "Arts & Creative" },
  { name: "Reading", category: "Education & Learning" },
  { name: "Gaming", category: "Entertainment" },
  { name: "Coding", category: "Technology" },
  { name: "Board Games", category: "Entertainment" },
  { name: "Yoga", category: "Sports & Fitness" },
  { name: "Music", category: "Arts & Creative" },
  { name: "Gardening", category: "Outdoor Activities" },
  { name: "Swimming", category: "Sports & Fitness" },
  { name: "Dancing", category: "Arts & Creative" },
  { name: "Traveling", category: "Outdoor Activities" },
  { name: "Writing", category: "Arts & Creative" },
  { name: "Meditation", category: "Wellness" },
  { name: "Volunteering", category: "Community" },
  { name: "Learning Languages", category: "Education & Learning" },
  { name: "Fishing", category: "Outdoor Activities" },
  { name: "Rock Climbing", category: "Sports & Fitness" },
  { name: "Skiing", category: "Sports & Fitness" },
  { name: "Surfing", category: "Sports & Fitness" },
  { name: "Chess", category: "Entertainment" },
  { name: "Podcasting", category: "Media & Communication" },
  { name: "Film Making", category: "Arts & Creative" },
  { name: "Pottery", category: "Arts & Creative" },
  { name: "Knitting", category: "Arts & Creative" },
  { name: "Woodworking", category: "Arts & Creative" },
];

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseBrowserClient();
    
    // Check if hobbies already exist
    const { data: existingHobbies, error: checkError } = await supabase
      .from('hobbies')
      .select('name');
    
    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    const existingNames = new Set(existingHobbies?.map(h => h.name) || []);
    const newHobbies = PREDEFINED_HOBBIES.filter(h => !existingNames.has(h.name));
    
    if (newHobbies.length === 0) {
      return NextResponse.json({ 
        message: 'All hobbies already exist in the database.',
        count: 0 
      });
    }
    
    // Insert new hobbies
    const { data, error } = await supabase
      .from('hobbies')
      .insert(newHobbies)
      .select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: `Successfully inserted ${data.length} hobbies`,
      hobbies: data,
      count: data.length 
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

