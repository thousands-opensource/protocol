import { useCallback } from 'react';
import { Button } from '@chakra-ui/react';
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { THEME_COLOR_DARK_GOLDEN_YELLOW } from '@/constants/constants';

export const DownloadChatSpreadsheet = ({
    beamableEventId,
}: {
    beamableEventId: string;
}) => {
    const generateExcel = useCallback(async () => {
        try {
            const response = await axiosAuthClientInstance.get(
                `/api/boostStats?eventId=${beamableEventId}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `chat-stats-${beamableEventId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating Excel:', error);
        }
    }, [beamableEventId]);

    return (
        <Button
            onClick={generateExcel}
            bg={THEME_COLOR_DARK_GOLDEN_YELLOW}
        >
            Download Event Activity
        </Button>
    );
};