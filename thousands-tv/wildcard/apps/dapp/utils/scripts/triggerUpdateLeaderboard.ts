import axios, { AxiosResponse } from 'axios';

require('dotenv').config();

interface UpdateSummariesResponse {
    success: boolean;
    message: string;
    data?: {
        totalUsers: number;
        updatedUsers: number;
        executionTimeMs: number;
    };
}

async function triggerUpdate(): Promise<void> {
    try {
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error('CRON_SECRET environment variable is not set');
            process.exit(1);
        }

        console.log('Triggering user insight score summaries update...');
        console.log(`URL: ${baseUrl}/api/cron/applyDecayToSummaries`);

        const startTime = Date.now();

        const response: AxiosResponse<UpdateSummariesResponse> = await axios.post(
            `${baseUrl}/api/cron/applyDecayToSummaries`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${cronSecret}`,
                    'Content-Type': 'application/json'
                },
                timeout: 300000 // 5 minute timeout
            }
        );

        const executionTime = Date.now() - startTime;

        if (response.data.success) {
            console.log('Update completed successfully!');
            console.log(`Results:`, response.data.data);
            console.log(`Total execution time: ${executionTime}ms`);
        } else {
            console.error('Update failed:', response.data.message);
        }

    } catch (error: any) {
        console.error('Error triggering update:', error.response?.data || error.message);
        process.exit(1);
    }
}

triggerUpdate();
