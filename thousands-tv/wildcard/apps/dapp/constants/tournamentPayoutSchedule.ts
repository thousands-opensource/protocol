export type TournamentPayoutSchedule = {
    range: [number, number];
    amountInCents: number;
}[];

export const tournamentPayoutSchedule: TournamentPayoutSchedule = [
    { range: [1, 2], amountInCents: 50000 },
    { range: [3, 4], amountInCents: 40000 },
    { range: [5, 6], amountInCents: 30000 },
    { range: [7, 8], amountInCents: 20000 },
    { range: [9, 16], amountInCents: 7500 },
    { range: [17, 32], amountInCents: 5000 },
    { range: [33, 64], amountInCents: 2500 },
];

export const tournamentPayoutSchedule2: TournamentPayoutSchedule = [
    { range: [1, 2], amountInCents: 30000 },
    { range: [3, 4], amountInCents: 25000 },
    { range: [5, 6], amountInCents: 17500 },
    { range: [7, 8], amountInCents: 12500 },
    { range: [9, 16], amountInCents: 5000 },
    { range: [17, 32], amountInCents: 2500 },
];

export const tournamentPayoutScheduleDaily: TournamentPayoutSchedule = [
    { range: [1, 2], amountInCents: 15000 },
    { range: [3, 4], amountInCents: 12000 },
    { range: [5, 6], amountInCents: 10000 },
    { range: [7, 8], amountInCents: 7000 },
];

export const tournamentPayoutScheduleDaily16: TournamentPayoutSchedule = [
    { range: [1, 2], amountInCents: 16000 },
    { range: [3, 4], amountInCents: 13000 },
    { range: [5, 6], amountInCents: 11000 },
    { range: [7, 8], amountInCents: 8000 },
    { range: [9, 16], amountInCents: 4000 },
];

export const tournamentPayoutScheduleWeekly: TournamentPayoutSchedule = [
    { range: [1, 2], amountInCents: 40000 },
    { range: [3, 4], amountInCents: 30000 },
    { range: [5, 6], amountInCents: 20000 },
    { range: [7, 8], amountInCents: 10000 },
];

export const tournamentPayoutScheduleWeekly16: TournamentPayoutSchedule = [
    { range: [1, 2], amountInCents: 42500 },
    { range: [3, 4], amountInCents: 32500 },
    { range: [5, 6], amountInCents: 22500 },
    { range: [7, 8], amountInCents: 12500 },
    { range: [9, 16], amountInCents: 7500 },
];