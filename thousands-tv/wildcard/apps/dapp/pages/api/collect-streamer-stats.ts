import { NextApiRequest, NextApiResponse } from 'next';
import { collectWildcardStreamerStats } from '../../scripts/collectWildcardStreamerStats';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed. Use POST to trigger collection.' });
    }

    const authHeader = req.headers.authorization;
    const expectedAuth = process.env.COLLECTION_API_KEY;

    if (!expectedAuth || authHeader !== `Bearer ${expectedAuth}`) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        console.log('Manual collection triggered via API');
        await collectWildcardStreamerStats();

        return res.status(200).json({
            message: 'Wildcard streamer stats collection completed successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in manual collection:', error);
        return res.status(500).json({
            message: 'Collection failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
