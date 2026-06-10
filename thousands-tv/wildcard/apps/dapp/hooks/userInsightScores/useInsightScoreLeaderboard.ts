import { useState, useEffect } from "react";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { LeaderboardEntry, InsightScoreLeaderboardApiResponse } from "@/pages/api/userInsightScores/getInsightScoreLeaderboard";

interface UseInsightScoreLeaderboardProps {
    limit?: number;
    offset?: number;
    fetchLeaderboard?: boolean;
}

export const useInsightScoreLeaderboard = ({
    limit = 10,
    offset = 0,
    fetchLeaderboard = true,
}: UseInsightScoreLeaderboardProps = {}) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | undefined>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getRankBadgeColor = (rank: number) => {
        if (rank === 1) return "gold";
        if (rank <= 3) return "orange";
        if (rank <= 10) return "green";
        if (rank <= 50) return "blue";
        return "gray";
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axiosAuthClientInstance.get<InsightScoreLeaderboardApiResponse>(
                `/api/userInsightScores/getInsightScoreLeaderboard?limit=${limit}&offset=${offset}`
            );

            if (response.data.success && response.data.data) {
                if (fetchLeaderboard) {
                    setLeaderboard(response.data.data);
                }
                setCurrentUserEntry(response.data.currentUserEntry);
            } else {
                setError(response.data.message || "Failed to fetch leaderboard");
            }
        } catch (err: any) {
            console.error("Error fetching insight score leaderboard:", err);
            setError(err.response?.data?.message || "Failed to fetch leaderboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [limit, offset, fetchLeaderboard]);

    const getUserEntry = (userId?: string) => {
        if (!userId) return null;
        return currentUserEntry ?? (fetchLeaderboard ? leaderboard.find(entry => entry.userId === userId) : null);
    };

    return {
        leaderboard: fetchLeaderboard ? leaderboard : [],
        currentUserEntry,
        getUserEntry,
        getRankBadgeColor,
        loading,
        error,
        fetchLeaderboard: fetchData,
        refetch: fetchData
    };
};
