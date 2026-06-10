import { Box, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";

interface StreamerListProps {}

interface StreamersResponse {
    success: boolean;
    data: string[];
    message?: string;
}

const StreamerList = ({}: StreamerListProps) => {
    const [streamers, setStreamers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStreamers = async () => {
            try {
                setLoading(true);
                const response = await axiosAuthClientInstance.get<StreamersResponse>("/api/admin/streamers");
                
                if (response.data.success) {
                    setStreamers(response.data.data);
                } else {
                    setError(response.data.message || "Failed to fetch streamers");
                }
            } catch (err) {
                console.error("Error fetching streamers:", err);
                setError("Failed to fetch streamers");
            } finally {
                setLoading(false);
            }
        };

        fetchStreamers();
    }, []);

    if (loading) {
        return (
            <Box>
                <Text color="gray.400">Loading streamers...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Box>
                <Text color="red.400">Error: {error}</Text>
            </Box>
        );
    }

    if (streamers.length === 0) {
        return (
            <Box>
                <Text color="gray.400">No streamers found</Text>
            </Box>
        );
    }

    return (
        <Box>
            <Text color="white" fontWeight="bold" mb="2">
                Users with Streamer Role:
            </Text>
            {streamers.map((streamerName, index) => (
                <Text key={index} color="white">
                    {streamerName}
                </Text>
            ))}
        </Box>
    );
};

export default StreamerList;
