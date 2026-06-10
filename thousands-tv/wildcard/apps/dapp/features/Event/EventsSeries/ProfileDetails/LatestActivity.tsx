import { Text, VStack, Flex } from "@chakra-ui/react";

interface LatestActivityProps {}

/**
 * LatestActivity component - renders the latest activity of the user
 */
const LatestActivity = ({}: LatestActivityProps) => {
    const activities = [
        {
            title: "Holder Preview: Wildcard New Game Build",
            timestamp: "yesterday, 2:30 CST",
        },
        {
            title: "Playtest: Publicly Viewable Palytest #75",
            timestamp: "Monday, 3:45 CST",
        },
        {
            title: "Holder-Only Townhall Q&A",
            timestamp: "1 month, 21 days ago",
        },
    ];

    const FONT_SIZE_LATEST_ACTIVITY_TEXT = "12px";

    return (
        <VStack align="stretch" spacing={2} w="100%">
            <Text color="gray.400" fontSize="xs" fontWeight="medium" mb={2}>
                Latest Activity
            </Text>
            {activities.map((activity, index) => (
                <Flex
                    key={index}
                    justify="space-between"
                    align="center"
                    wrap={"wrap"}
                    w="100%"
                >
                    <Text
                        color="white"
                        _hover={{ color: "blue.400" }}
                        cursor="pointer"
                        fontSize={FONT_SIZE_LATEST_ACTIVITY_TEXT}
                    >
                        {activity.title}
                    </Text>
                    <Text
                        color="gray.500"
                        fontSize={FONT_SIZE_LATEST_ACTIVITY_TEXT}
                    >
                        {activity.timestamp}
                    </Text>
                </Flex>
            ))}
        </VStack>
    );
};

export default LatestActivity;
