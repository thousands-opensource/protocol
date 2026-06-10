import dayjs from "dayjs";

/**
 * Formats the date and time of a notification.
 * Shows only time if the date is today, otherwise shows the full date and time.
 *
 * @param {Date} dateString - The date string to format.
 * @returns {string} - The formatted date and time.
 */
export const formatDateTime = (dateString: Date) => {
    const date = dayjs(dateString);
    const now = dayjs();

    if (date.isSame(now, "day")) {
        // If the date is today, return only the time
        return date.format("HH:mm");
    } else {
        // Otherwise, return the full date and time
        return date.format("YYYY-MM-DD HH:mm");
    }
};

/**
 * Generates random notifications for the game "Wildcard".
 * @dev - example to show how to create notifications via Notification API.
 *
 * @param {string} userId - The ID of the recipient user.
 * @returns {object} The generated notification data.
 */
export const generateRandomNotification = (userId: string) => {
    const characters = ["Locke", "Bolgar", "Janz", "Fendor"];
    const events = [
        "upcoming match",
        "special event",
        "tournament",
        "new challenge",
        "battle royale",
    ];

    const getRandomItem = (arr: string[]) =>
        arr[Math.floor(Math.random() * arr.length)];

    const character1 = getRandomItem(characters);
    let character2 = getRandomItem(characters);
    while (character1 === character2) {
        character2 = getRandomItem(characters);
    }

    const event = getRandomItem(events);
    const subject = `${character1} vs ${character2} - ${event}`;
    const body = `Get ready for an exciting ${event} between ${character1} and ${character2}! Don't miss out on the action.`;

    return {
        recipientUserId: userId,
        subject,
        body,
        status: "pending",
        priority: "medium",
        sentAt: new Date(),
    };
};
