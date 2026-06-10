import axios from 'axios';

export interface StreamsChartsApiResponse {
    data: StreamsChartsChannel[];
    links: {
        first?: string;
        next?: string;
        prev?: string;
        last?: string;
    };
    meta: {
        current_page: number;
        from: number;
        path: string;
        per_page: number;
        to: number;
        total?: number;
        last_page?: number;
    };
    filters: {
        platform?: string;
        time?: string;
        game?: string;
        [key: string]: any;
    };
}

export interface StreamsChartsChannel {
    platform: string;
    channel_name: string;
    channel_display_name: string;
    channel_id: string;
    hours_watched: number;
    peak_viewers: number;
    average_viewers: number;
}

export class StreamsChartsService {
    private clientId: string;
    private token: string;
    private baseUrl = 'https://streamscharts.com/api/jazz/channels';
    private useMockData: boolean;

    constructor(clientId: string, token: string, useMockData: boolean = false) {
        this.clientId = clientId;
        this.token = token;
        this.useMockData = useMockData || process.env.USE_MOCK_STREAMS_DATA === 'true';
    }

    private getMockResponse(page: number): StreamsChartsApiResponse {
        const mockChannels: StreamsChartsChannel[] = [
            {
                platform: 'twitch',
                channel_name: 'streamer1',
                channel_display_name: 'Streamer1',
                channel_id: '12345',
                hours_watched: 5420,
                peak_viewers: 1250,
                average_viewers: 890,
            },
            {
                platform: 'twitch',
                channel_name: 'wildcard_pro',
                channel_display_name: 'WildcardPro',
                channel_id: '67890',
                hours_watched: 3210,
                peak_viewers: 780,
                average_viewers: 560,
            },
            {
                platform: 'twitch',
                channel_name: 'gaming_master',
                channel_display_name: 'GamingMaster',
                channel_id: '11111',
                hours_watched: 2890,
                peak_viewers: 650,
                average_viewers: 420,
            },
            {
                platform: 'twitch',
                channel_name: 'wildcard_fan',
                channel_display_name: 'WildcardFan',
                channel_id: '22222',
                hours_watched: 1560,
                peak_viewers: 340,
                average_viewers: 280,
            },
            {
                platform: 'twitch',
                channel_name: 'card_player',
                channel_display_name: 'CardPlayer',
                channel_id: '33333',
                hours_watched: 890,
                peak_viewers: 180,
                average_viewers: 120,
            },
        ];

        return {
            data: page === 1 ? mockChannels : [],
            links: {
                first: 'https://streamscharts.com/api/jazz/channels?page=1',
                next: page === 1 ? undefined : undefined,
            },
            meta: {
                current_page: page,
                from: page === 1 ? 1 : 0,
                path: 'https://streamscharts.com/api/jazz/channels',
                per_page: 100,
                to: page === 1 ? mockChannels.length : 0,
                total: mockChannels.length,
                last_page: 1,
            },
            filters: {
                platform: 'twitch',
                time: '2025-08-03,2025-08-03',
                game: 'wildcard',
            },
        };
    }

    async getChannelsByGameAndDate(
        game: string,
        date: string,
        page: number = 1,
        platform: string = 'twitch'
    ): Promise<StreamsChartsApiResponse> {
        if (this.useMockData) {
            console.log(`Using mock data for page ${page}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.getMockResponse(page);
        }

        const params = new URLSearchParams({
            platform,
            game,
            time: `${date},${date}`,
            page: page.toString(),
        });

        const headers = {
            'Client-ID': this.clientId,
            'Token': this.token,
        };

        console.log('API Request URL:', `${this.baseUrl}?${params}`);
        console.log('API Request Headers:', headers);

        try {
            const response = await axios.get(`${this.baseUrl}?${params}`, { headers });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching channels from Streams Charts API:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            throw error;
        }
    }

    async getAllChannelsByGameAndDate(
        game: string,
        date: string,
        platform: string = 'twitch'
    ): Promise<StreamsChartsChannel[]> {
        const allChannels: StreamsChartsChannel[] = [];
        let page = 1;
        let hasNextPage = true;

        console.log(`Fetching channels for game: ${game}, date: ${date}, platform: ${platform}`);

        while (hasNextPage) {
            console.log(`Fetching page ${page}...`);

            try {
                const response = await this.getChannelsByGameAndDate(game, date, page, platform);

                allChannels.push(...response.data);

                console.log(`Page ${page}: Found ${response.data.length} channels`);

                hasNextPage = !!response.links.next;
                page++;

                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`Error fetching page ${page}:`, error);
                hasNextPage = false;
            }
        }

        console.log(`Total channels collected: ${allChannels.length}`);
        return allChannels;
    }
}
