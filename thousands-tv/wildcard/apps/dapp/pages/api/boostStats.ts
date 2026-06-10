import { COOKIES_ACCESS_TOKEN_WILDCARD } from '@/utils/accountAPIUtil';
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDb from '@/db/connectToDb';
import { boostsSegmentsModel, chatMessagesSegmentsModel, chatReactionsSegmentsModel, stagesModel } from '@repo/schemas';
import { getFanDetails } from './pledgeAI/util/util';
import StageRepository from '@/repositories/implementations/mongodb/stageRepository';
import IStageRepository from '@/repositories/interfaces/iStageRepository';
import { diContainer } from '@/inversify.config';
import { Boost, ChatMessage, ChatReaction } from '@repo/interfaces';
import * as XLSX from 'xlsx';

interface UserStat {
    UserId: string;
    UserName: string;
    WalletAddress: string;
    BoostSpending: number;
    BoostBonus: number;
    SkyboxSpending: number;
    SkyboxBonus: number;
    SkyboxId: string;
    SkyboxTier: number;
    MessageCount: number;
    ReactionsMyMessagesGot: number;
    WildpassCount: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const eventId = req.query.eventId as string;

    if (!eventId) {
        return res.status(400).json({ error: 'eventId required' });
    }

    try {
        const wildcardAccessToken = req.cookies[COOKIES_ACCESS_TOKEN_WILDCARD] || "";
        const fans = await getFanDetails(eventId, wildcardAccessToken);

        await connectToDb();

        const stageRepository: IStageRepository =
            diContainer.get("IStageRepository");

        const stage = await stageRepository.getEventFromVendorEventId(eventId);

        if (!stage) {
            return res.status(404).json({ error: 'Stage not found for the provided eventId' });
        }

        const stageId = stage._id.toString();

        const [boostsSegments, chatMessagesSegments, chatReactionsSegments] = await Promise.all([
            boostsSegmentsModel.find({
                $or: [
                    { "boosts.stageId": stageId },
                    { "boosts.vendorEventId": eventId }
                ]
            }).lean(),
            chatMessagesSegmentsModel.find({
                $or: [
                    { "chatMessages.stageId": stageId },
                    { "chatMessages.vendorEventId": eventId }
                ]
            }).lean(),
            chatReactionsSegmentsModel.find({
                $or: [
                    { "chatReactions.stageId": stageId },
                    { "chatReactions.vendorEventId": eventId }
                ]
            }).lean()
        ]);

        const segments = new Set([
            ...boostsSegments.map(s => s.segment),
            ...chatMessagesSegments.map(s => s.segment),
            ...chatReactionsSegments.map(s => s.segment)
        ]);

        const segmentStats: Record<number, UserStat[]> = {};
        segments.forEach(segment => {
            const userStats = new Map<string, UserStat>();

            fans.forEach(fan => {
                if (fan.HasWalletAddress) {
                    userStats.set(fan.FanId, {
                        UserId: fan.FanId,
                        UserName: fan.FanName,
                        WalletAddress: fan.WalletAddress || "",
                        BoostSpending: 0,
                        BoostBonus: 0,
                        SkyboxSpending: 0,
                        SkyboxBonus: 0,
                        SkyboxId: "",
                        SkyboxTier: 0,
                        MessageCount: 0,
                        ReactionsMyMessagesGot: 0,
                        WildpassCount: fan.Wildpasses?.length || 0
                    });
                }
            });

            boostsSegments
                .filter(s => s.segment === segment)
                .forEach(segmentData => {
                    segmentData.boosts.forEach((boost) => {
                        if (boost.stageId === stageId) {
                            const userStat = userStats.get(boost.userId);
                            if (userStat) {

                                if (!!boost.skyboxId && boost.skyboxId !== "") {
                                    userStat.SkyboxSpending += boost.boostPrice ?? 0;
                                    userStat.SkyboxBonus += boost.boostAmount ?? 0;
                                    if (!userStat.SkyboxId) {
                                        userStat.SkyboxId = boost.skyboxId.toString();
                                        userStat.SkyboxTier = boost.skyboxTier ?? 0;
                                    }
                                } else {
                                    userStat.BoostSpending += boost.boostPrice ?? 0;
                                    userStat.BoostBonus += boost.boostAmount ?? 0;
                                }
                            }
                        }
                    });
                });

            chatMessagesSegments
                .filter(s => s.segment === segment)
                .forEach(segmentData => {
                    segmentData.chatMessages.forEach((message: ChatMessage) => {
                        if (message.stageId === stageId) {
                            const userStat = userStats.get(message.userId);
                            if (userStat) {
                                userStat.MessageCount += 1;
                            }
                        }
                    });
                });

            chatReactionsSegments
                .filter(s => s.segment === segment)
                .forEach(segmentData => {
                    segmentData.chatReactions.forEach((reaction: ChatReaction) => {
                        if (reaction.stageId === stageId) {
                            const userStat = userStats.get(reaction.originalMessageUserId);
                            if (userStat) {
                                userStat.ReactionsMyMessagesGot += reaction.emojiAddedOrRemoved ? -1 : 1;
                            }
                        }
                    });
                });

            segmentStats[segment] = Array.from(userStats.values())
                .sort((a, b) => (b.BoostSpending + b.SkyboxSpending) - (a.BoostSpending + a.SkyboxSpending));
        });

        const totalStats = new Map<string, UserStat>();
        Object.values(segmentStats).forEach(segmentData => {
            segmentData.forEach(userData => {
                const existing = totalStats.get(userData.UserId) || {
                    ...userData,
                    BoostSpending: 0,
                    BoostBonus: 0,
                    SkyboxSpending: 0,
                    SkyboxBonus: 0,
                    MessageCount: 0,
                    ReactionsMyMessagesGot: 0
                };

                totalStats.set(userData.UserId, {
                    ...existing,
                    BoostSpending: existing.BoostSpending + userData.BoostSpending,
                    BoostBonus: existing.BoostBonus + userData.BoostBonus,
                    SkyboxSpending: existing.SkyboxSpending + userData.SkyboxSpending,
                    SkyboxBonus: existing.SkyboxBonus + userData.SkyboxBonus,
                    MessageCount: existing.MessageCount + userData.MessageCount,
                    ReactionsMyMessagesGot: existing.ReactionsMyMessagesGot + userData.ReactionsMyMessagesGot,
                    SkyboxId: existing.SkyboxId || userData.SkyboxId,
                    SkyboxTier: existing.SkyboxTier || userData.SkyboxTier
                });
            });
        });

        const totals = Array.from(totalStats.values())
            .sort((a, b) => (b.BoostSpending + b.SkyboxSpending) - (a.BoostSpending + a.SkyboxSpending));

        const workbook = XLSX.utils.book_new();

        Object.entries(segmentStats).forEach(([segment, userData]) => {
            const segmentNumber = parseInt(segment);
            const worksheet = XLSX.utils.json_to_sheet(userData, {
                header: [
                    'UserId', 'UserName', 'WalletAddress',
                    'BoostSpending', 'BoostBonus',
                    'SkyboxSpending', 'SkyboxBonus', 'SkyboxId', 'SkyboxTier',
                    'MessageCount', 'ReactionsMyMessagesGot', 'WildpassCount'
                ]
            });

            const segmentTotals = userData.reduce((acc, user) => ({
                BoostSpending: acc.BoostSpending + user.BoostSpending,
                BoostBonus: acc.BoostBonus + user.BoostBonus,
                SkyboxSpending: acc.SkyboxSpending + user.SkyboxSpending,
                SkyboxBonus: acc.SkyboxBonus + user.SkyboxBonus,
                WildpassCount: acc.WildpassCount + user.WildpassCount
            }), {
                BoostSpending: 0,
                BoostBonus: 0,
                SkyboxSpending: 0,
                SkyboxBonus: 0,
                WildpassCount: 0
            });

            XLSX.utils.sheet_add_json(worksheet, [{
                UserName: '',
                WalletAddress: '',
                BoostSpending: segmentTotals.BoostSpending,
                BoostBonus: segmentTotals.BoostBonus,
                SkyboxSpending: segmentTotals.SkyboxSpending,
                SkyboxBonus: segmentTotals.SkyboxBonus,
                SkyboxId: '',
                SkyboxTier: '',
                MessageCount: '',
                ReactionsMyMessagesGot: '',
                WildpassCount: segmentTotals.WildpassCount
            }], {
                header: [
                    'UserId', 'UserName', 'WalletAddress',
                    'BoostSpending', 'BoostBonus',
                    'SkyboxSpending', 'SkyboxBonus', 'SkyboxId', 'SkyboxTier',
                    'MessageCount', 'ReactionsMyMessagesGot', 'WildpassCount'
                ],
                origin: -1
            });

            XLSX.utils.book_append_sheet(workbook, worksheet, `Round ${segmentNumber + 1}`);
        });

        const totalsWorksheet = XLSX.utils.json_to_sheet(totals, {
            header: [
                'UserId', 'UserName', 'WalletAddress',
                'BoostSpending', 'BoostBonus',
                'SkyboxSpending', 'SkyboxBonus', 'SkyboxId', 'SkyboxTier',
                'MessageCount', 'ReactionsMyMessagesGot', 'WildpassCount'
            ]
        });

        const grandTotals = totals.reduce((acc, user) => ({
            BoostSpending: acc.BoostSpending + user.BoostSpending,
            BoostBonus: acc.BoostBonus + user.BoostBonus,
            SkyboxSpending: acc.SkyboxSpending + user.SkyboxSpending,
            SkyboxBonus: acc.SkyboxBonus + user.SkyboxBonus,
            WildpassCount: acc.WildpassCount + user.WildpassCount
        }), {
            BoostSpending: 0,
            BoostBonus: 0,
            SkyboxSpending: 0,
            SkyboxBonus: 0,
            WildpassCount: 0
        });

        XLSX.utils.sheet_add_json(totalsWorksheet, [{
            UserName: '',
            WalletAddress: '',
            BoostSpending: grandTotals.BoostSpending,
            BoostBonus: grandTotals.BoostBonus,
            SkyboxSpending: grandTotals.SkyboxSpending,
            SkyboxBonus: grandTotals.SkyboxBonus,
            SkyboxId: '',
            SkyboxTier: '',
            MessageCount: '',
            ReactionsMyMessagesGot: '',
            WildpassCount: grandTotals.WildpassCount
        }], {
            header: [
                'UserId', 'UserName', 'WalletAddress',
                'BoostSpending', 'BoostBonus',
                'SkyboxSpending', 'SkyboxBonus', 'SkyboxId', 'SkyboxTier',
                'MessageCount', 'ReactionsMyMessagesGot', 'WildpassCount'
            ],
            origin: -1
        });

        XLSX.utils.book_append_sheet(workbook, totalsWorksheet, 'Totals');

        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=event-activity-${eventId}.xlsx`);

        return res.send(excelBuffer);
    } catch (error: any) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Failed to fetch data', details: error?.message });
    }
}