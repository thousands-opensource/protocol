export function getEreyesterdayDate(fromDate?: Date): Date {
    const baseDate = fromDate || new Date();
    const dayOfWeek = baseDate.getDay();

    let daysToSubtract: number;

    if (dayOfWeek === 0) {
        daysToSubtract = 2;
    } else if (dayOfWeek === 1) {
        daysToSubtract = 3;
    } else {
        daysToSubtract = 2;
    }

    const ereyesterday = new Date(baseDate);
    ereyesterday.setDate(baseDate.getDate() - daysToSubtract);
    ereyesterday.setHours(0, 0, 0, 0);

    return ereyesterday;
}

export function formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
}
