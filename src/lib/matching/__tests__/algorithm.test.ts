/**
 * Unit tests for matching algorithm
 */

import {
  calculateHobbyCompatibility,
  calculateLocationProximity,
  calculateActivityLevel,
  calculateSimilarityScore,
  getWeekString,
  generateMatches,
  applyDiversityFilter
} from '../algorithm';

describe('Matching Algorithm', () => {
  describe('calculateHobbyCompatibility', () => {
    it('should return 0 when users have no shared hobbies', () => {
      const hobbies1 = [
        { hobby_id: 'hobby1', preference_rank: 1 },
        { hobby_id: 'hobby2', preference_rank: 2 }
      ];
      const hobbies2 = [
        { hobby_id: 'hobby3', preference_rank: 1 },
        { hobby_id: 'hobby4', preference_rank: 2 }
      ];

      const score = calculateHobbyCompatibility(hobbies1, hobbies2);
      expect(score).toBe(0);
    });

    it('should return high score for identical hobby preferences', () => {
      const hobbies = [
        { hobby_id: 'hobby1', preference_rank: 1 },
        { hobby_id: 'hobby2', preference_rank: 2 },
        { hobby_id: 'hobby3', preference_rank: 3 }
      ];

      const score = calculateHobbyCompatibility(hobbies, hobbies);
      expect(score).toBeGreaterThan(0.8);
    });

    it('should give higher scores when shared hobbies are ranked similarly', () => {
      const hobbies1 = [
        { hobby_id: 'hobby1', preference_rank: 1 },
        { hobby_id: 'hobby2', preference_rank: 2 }
      ];
      const hobbies2Similar = [
        { hobby_id: 'hobby1', preference_rank: 1 },
        { hobby_id: 'hobby2', preference_rank: 3 }
      ];
      const hobbies2Different = [
        { hobby_id: 'hobby1', preference_rank: 10 },
        { hobby_id: 'hobby2', preference_rank: 9 }
      ];

      const scoreSimilar = calculateHobbyCompatibility(hobbies1, hobbies2Similar);
      const scoreDifferent = calculateHobbyCompatibility(hobbies1, hobbies2Different);

      expect(scoreSimilar).toBeGreaterThan(scoreDifferent);
    });

    it('should return 0 when one user has no hobbies', () => {
      const hobbies1 = [{ hobby_id: 'hobby1', preference_rank: 1 }];
      const hobbies2: Array<{ hobby_id: string; preference_rank: number }> = [];

      const score = calculateHobbyCompatibility(hobbies1, hobbies2);
      expect(score).toBe(0);
    });
  });

  describe('calculateLocationProximity', () => {
    it('should return high score for very close users (< 5km)', () => {
      const score = calculateLocationProximity(2);
      expect(score).toBeGreaterThan(0.85);
    });

    it('should return moderate score for mid-range distance', () => {
      const score = calculateLocationProximity(25);
      expect(score).toBeGreaterThan(0.2);
      expect(score).toBeLessThan(0.5);
    });

    it('should return low score for users near max radius', () => {
      const score = calculateLocationProximity(48, 50);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(0.2);
    });

    it('should return 0 for users beyond max radius', () => {
      const score = calculateLocationProximity(60, 50);
      expect(score).toBe(0);
    });

    it('should handle custom max radius', () => {
      const score1 = calculateLocationProximity(40, 100);
      const score2 = calculateLocationProximity(40, 50);
      expect(score1).toBeGreaterThan(score2);
    });
  });

  describe('calculateActivityLevel', () => {
    it('should return high score for users active today', () => {
      const now = new Date();
      const score = calculateActivityLevel(now.toISOString());
      expect(score).toBe(1.0);
    });

    it('should return moderate score for users active this week', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const score = calculateActivityLevel(threeDaysAgo.toISOString());
      expect(score).toBe(0.8);
    });

    it('should return lower score for users active this month', () => {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      const score = calculateActivityLevel(fifteenDaysAgo.toISOString());
      expect(score).toBe(0.6);
    });

    it('should return low score for inactive users', () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const score = calculateActivityLevel(threeMonthsAgo.toISOString());
      expect(score).toBe(0.2);
    });
  });

  describe('calculateSimilarityScore', () => {
    const user1 = {
      user_id: 'user1',
      hobbies: [
        { hobby_id: 'hobby1', preference_rank: 1 },
        { hobby_id: 'hobby2', preference_rank: 2 }
      ],
      latitude: 40.7128,
      longitude: -74.0060,
      last_active: new Date().toISOString()
    };

    const user2 = {
      user_id: 'user2',
      hobbies: [
        { hobby_id: 'hobby1', preference_rank: 1 },
        { hobby_id: 'hobby2', preference_rank: 3 }
      ],
      latitude: 40.7589,
      longitude: -73.9851,
      last_active: new Date().toISOString(),
      distance_km: 5
    };

    it('should return score between 0 and 1', () => {
      const { score } = calculateSimilarityScore(user1, user2);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return breakdown with hobby, location, and activity scores', () => {
      const { breakdown } = calculateSimilarityScore(user1, user2);
      expect(breakdown).toHaveProperty('hobby');
      expect(breakdown).toHaveProperty('location');
      expect(breakdown).toHaveProperty('activity');
      expect(breakdown.hobby).toBeGreaterThanOrEqual(0);
      expect(breakdown.location).toBeGreaterThanOrEqual(0);
      expect(breakdown.activity).toBeGreaterThanOrEqual(0);
    });

    it('should weight hobby compatibility highest', () => {
      const userNoHobbies = {
        ...user2,
        hobbies: []
      };
      const { score: scoreWithHobbies } = calculateSimilarityScore(user1, user2);
      const { score: scoreWithoutHobbies } = calculateSimilarityScore(user1, userNoHobbies);

      expect(scoreWithHobbies).toBeGreaterThan(scoreWithoutHobbies);
    });
  });

  describe('getWeekString', () => {
    it('should return string in format YYYY-WXX', () => {
      const weekString = getWeekString();
      expect(weekString).toMatch(/^\d{4}-W\d{2}$/);
    });

    it('should return same week string for dates in same week', () => {
      const date1 = new Date('2025-01-06'); // Monday
      const date2 = new Date('2025-01-08'); // Wednesday
      const week1 = getWeekString(date1);
      const week2 = getWeekString(date2);
      expect(week1).toBe(week2);
    });

    it('should return different week strings for different weeks', () => {
      const date1 = new Date('2025-01-06');
      const date2 = new Date('2025-01-13');
      const week1 = getWeekString(date1);
      const week2 = getWeekString(date2);
      expect(week1).not.toBe(week2);
    });
  });

  describe('generateMatches', () => {
    const currentUser = {
      user_id: 'current-user',
      hobbies: [
        { hobby_id: 'hobby1', preference_rank: 1 },
        { hobby_id: 'hobby2', preference_rank: 2 }
      ],
      latitude: 40.7128,
      longitude: -74.0060,
      last_active: new Date().toISOString()
    };

    const candidates = [
      {
        user_id: 'candidate1',
        hobbies: [
          { hobby_id: 'hobby1', preference_rank: 1 },
          { hobby_id: 'hobby2', preference_rank: 2 }
        ],
        latitude: 40.7589,
        longitude: -73.9851,
        last_active: new Date().toISOString(),
        distance_km: 5
      },
      {
        user_id: 'candidate2',
        hobbies: [
          { hobby_id: 'hobby1', preference_rank: 2 }
        ],
        latitude: 40.7300,
        longitude: -74.0000,
        last_active: new Date().toISOString(),
        distance_km: 3
      },
      {
        user_id: 'candidate3',
        hobbies: [
          { hobby_id: 'hobby3', preference_rank: 1 }
        ],
        latitude: 40.7400,
        longitude: -73.9900,
        last_active: new Date().toISOString(),
        distance_km: 8
      }
    ];

    it('should generate matches sorted by similarity score', () => {
      const matches = generateMatches(currentUser, candidates, new Set(), 3);
      
      expect(matches.length).toBeGreaterThan(0);
      
      // Verify sorted descending
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i - 1].similarity_score).toBeGreaterThanOrEqual(matches[i].similarity_score);
      }
    });

    it('should respect the match limit', () => {
      const matches = generateMatches(currentUser, candidates, new Set(), 2);
      expect(matches.length).toBeLessThanOrEqual(2);
    });

    it('should exclude existing matches', () => {
      const existingMatchIds = new Set(['candidate1']);
      const matches = generateMatches(currentUser, candidates, existingMatchIds, 3);
      
      const matchedIds = matches.map(m => m.user_2_id);
      expect(matchedIds).not.toContain('candidate1');
    });

    it('should not match user with themselves', () => {
      const candidatesWithSelf = [...candidates, currentUser];
      const matches = generateMatches(currentUser, candidatesWithSelf as any, new Set(), 5);
      
      const matchedIds = matches.map(m => m.user_2_id);
      expect(matchedIds).not.toContain(currentUser.user_id);
    });

    it('should include match_week in results', () => {
      const matches = generateMatches(currentUser, candidates, new Set(), 2);
      
      matches.forEach(match => {
        expect(match.match_week).toMatch(/^\d{4}-W\d{2}$/);
      });
    });
  });

  describe('applyDiversityFilter', () => {
    const newMatches = [
      {
        user_1_id: 'user1',
        user_2_id: 'candidate1',
        similarity_score: 0.9,
        match_week: '2025-W01',
        hobby_score: 0.9,
        location_score: 0.9,
        activity_score: 0.9
      },
      {
        user_1_id: 'user1',
        user_2_id: 'candidate2',
        similarity_score: 0.85,
        match_week: '2025-W01',
        hobby_score: 0.8,
        location_score: 0.9,
        activity_score: 0.9
      }
    ];

    const recentMatches = [
      {
        user_1_id: 'user1',
        user_2_id: 'candidate1',
        similarity_score: 0.8,
        match_week: '2024-W52'
      }
    ];

    it('should penalize recently matched users', () => {
      const filtered = applyDiversityFilter(newMatches, recentMatches);
      
      const candidate1Match = filtered.find(m => m.user_2_id === 'candidate1');
      const candidate2Match = filtered.find(m => m.user_2_id === 'candidate2');
      
      expect(candidate1Match!.similarity_score).toBeLessThan(0.9);
      expect(candidate2Match!.similarity_score).toBe(0.85);
    });

    it('should return unchanged matches when no recent matches', () => {
      const filtered = applyDiversityFilter(newMatches, []);
      expect(filtered).toEqual(newMatches);
    });

    it('should re-sort matches after applying penalties', () => {
      const filtered = applyDiversityFilter(newMatches, recentMatches);
      
      // Verify sorted descending
      for (let i = 1; i < filtered.length; i++) {
        expect(filtered[i - 1].similarity_score).toBeGreaterThanOrEqual(filtered[i].similarity_score);
      }
    });
  });
});

