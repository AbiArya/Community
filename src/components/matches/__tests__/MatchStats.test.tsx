import { render, screen } from "@testing-library/react";
import { MatchStats } from "@/components/matches/MatchStats";
import type { MatchStats as MatchStatsType } from "@/hooks/useMatches";

describe("MatchStats", () => {
  const mockStats: MatchStatsType = {
    totalMatches: 24,
    averageScore: 72,
    thisWeekMatches: 2,
    weeklyBreakdown: {
      "2025-W49": 2,
      "2025-W48": 3,
      "2025-W47": 2,
      "2025-W46": 4,
    },
  };

  test("renders total matches", () => {
    render(<MatchStats stats={mockStats} />);
    
    expect(screen.getByText("Total Matches")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
  });

  test("renders this week matches with trend", () => {
    render(<MatchStats stats={mockStats} />);
    
    expect(screen.getByText("This Week")).toBeInTheDocument();
    // "2" appears multiple times (stat value + chart), so check the trend instead
    expect(screen.getByText("+2 this week")).toBeInTheDocument();
    expect(screen.getByText("New connections")).toBeInTheDocument();
  });

  test("renders average compatibility score", () => {
    render(<MatchStats stats={mockStats} />);
    
    expect(screen.getByText("Avg. Compatibility")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
  });

  test("shows compatibility label for great matches", () => {
    render(<MatchStats stats={mockStats} />);
    
    expect(screen.getByText("Great matches")).toBeInTheDocument();
  });

  test("shows excellent match quality for 80+ score", () => {
    const excellentStats: MatchStatsType = {
      ...mockStats,
      averageScore: 85,
    };
    
    render(<MatchStats stats={excellentStats} />);
    expect(screen.getByText("Excellent match quality!")).toBeInTheDocument();
  });

  test("shows good compatibility for 40-59 score", () => {
    const goodStats: MatchStatsType = {
      ...mockStats,
      averageScore: 45,
    };
    
    render(<MatchStats stats={goodStats} />);
    expect(screen.getByText("Good compatibility")).toBeInTheDocument();
  });

  test("shows some common interests for 20-39 score", () => {
    const lowStats: MatchStatsType = {
      ...mockStats,
      averageScore: 25,
    };
    
    render(<MatchStats stats={lowStats} />);
    expect(screen.getByText("Some common interests")).toBeInTheDocument();
  });

  test("shows building network for <20 score", () => {
    const veryLowStats: MatchStatsType = {
      ...mockStats,
      averageScore: 15,
    };
    
    render(<MatchStats stats={veryLowStats} />);
    expect(screen.getByText("Building your network")).toBeInTheDocument();
  });

  test("renders weekly chart when multiple weeks", () => {
    render(<MatchStats stats={mockStats} />);
    
    expect(screen.getByText("Weekly Matches")).toBeInTheDocument();
  });

  test("does not render weekly chart with only one week", () => {
    const singleWeekStats: MatchStatsType = {
      ...mockStats,
      weeklyBreakdown: { "2025-W49": 2 },
    };
    
    render(<MatchStats stats={singleWeekStats} />);
    expect(screen.queryByText("Weekly Matches")).not.toBeInTheDocument();
  });

  test("displays week labels in chart", () => {
    render(<MatchStats stats={mockStats} />);
    
    // Week labels are formatted as W## 
    expect(screen.getByText("W49")).toBeInTheDocument();
    expect(screen.getByText("W48")).toBeInTheDocument();
    expect(screen.getByText("W47")).toBeInTheDocument();
    expect(screen.getByText("W46")).toBeInTheDocument();
  });

  test("does not show trend when no matches this week", () => {
    const noNewStats: MatchStatsType = {
      ...mockStats,
      thisWeekMatches: 0,
    };
    
    render(<MatchStats stats={noNewStats} />);
    expect(screen.queryByText(/\+\d+ this week/)).not.toBeInTheDocument();
  });

  test("renders all stat cards", () => {
    render(<MatchStats stats={mockStats} />);
    
    // Check that all three main stats are rendered
    const statLabels = ["Total Matches", "This Week", "Avg. Compatibility"];
    statLabels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  test("renders with zero stats", () => {
    const zeroStats: MatchStatsType = {
      totalMatches: 0,
      averageScore: 0,
      thisWeekMatches: 0,
      weeklyBreakdown: {},
    };
    
    render(<MatchStats stats={zeroStats} />);
    
    expect(screen.getByText("0%")).toBeInTheDocument();
    // Total matches should show 0
    const totalElement = screen.getByText("Total Matches").closest('div');
    expect(totalElement?.parentElement).toHaveTextContent("0");
  });
});

