import {
    LEADERBOARD_AVATAR_BG_COLOR1,
    LEADERBOARD_AVATAR_BG_COLOR2,
    LEADERBOARD_PLACEHOLDER_COLOR,
} from "@/constants/constants";
import { Leader } from "@/types";
import {
    Avatar,
    Box,
    Divider,
    Flex,
    Image,
    Text,
    Tooltip,
    useBreakpointValue,
    VStack,
} from "@chakra-ui/react";
import { useGetUsersStore } from "@/store/useGetUsersStore";
import { formatNumber } from "@/utils/util";

//This will get replaced with JSON from the API
export const MOCK_CHAT_LEADERBOARD = {
    CurrentUserId: "66ff34dbd344b221b9a324f2gg",
    Leaders: [
        {
            Rank: 1,
            PreviousRank: 1,
            UserId: "66a90f3d7f01341f8da3803d",
            Username: "Anonymous",
            PfpImageUrl:
                "https://pbs.twimg.com/profile_images/1491907778620833799/-H0MMFUk_normal.jpg",
            Score: 10,
        },
        {
            Rank: 2,
            PreviousRank: 2,
            UserId: "2",
            Username: "Anonymous",
            PfpImageUrl:
                "https://pbs.twimg.com/profile_images/1864090610153787392/Ll17cBl3_normal.png",
            Score: 9,
        },
        {
            Rank: 3,
            PreviousRank: 3,
            UserId: "3",
            Username: "Anonymous",
            PfpImageUrl:
                "https://pbs.twimg.com/profile_images/1863690256760934401/Mc9UfdYB_normal.jpg",
            Score: 8,
        },
        {
            Rank: 4,
            PreviousRank: 4,
            UserId: "99999", // Tino
            Username: "Anonymous",
            PfpImageUrl:
                "http://localhost:3000/images/ServerNavigation/thousandsservercircle.svg",
            Score: 7,
        },
        {
            Rank: 5,
            PreviousRank: 5,
            UserId: "66ff34dbd344b221b9a324f2gg",
            Username: "Anonymous",
            PfpImageUrl:
                "https://i.seadn.io/s/raw/files/37f6d1a3e50b09a0c2354f3438f1f946.png?auto=format&dpr=1&w=1000",
            Score: 6,
        },
        {
            Rank: 6,
            PreviousRank: 6,
            UserId: "6",
            Username: "Anonymous",
            PfpImageUrl:
                "http://localhost:3000/images/ServerNavigation/thousandsicon.svg",
            Score: 5,
        },
        {
            Rank: 7,
            PreviousRank: 7,
            UserId: "555",
            Username: "Anonymous",
            PfpImageUrl:
                "https://i.seadn.io/s/raw/files/37f6d1a3e50b09a0c2354f3438f1f946.png?auto=format&dpr=1&w=1000",
            Score: 4,
        },
    ],
};

interface ChatLeaderboardProps {
    leaders: Leader[];
    currentUserId: string;
}

const LeaderboardEntry: React.FC<{
    leader: Leader & { isPlaceholder?: boolean };
    isCurrentUser: boolean;
}> = ({ leader, isCurrentUser }) => {
    const rankDiff = leader.PreviousRank - leader.Rank;

    const getUser = useGetUsersStore((state) => state.getUser);
    const user = getUser(leader.UserId);
    const pfpUrl = user?.profileUrl ?? "";
    const userName = user?.name ?? "";

    const shortUserName =
        userName.length > 4 ? userName.substring(0, 4) + "..." : userName;
    const formattedScore = formatNumber(leader.Score);

    const RankChangeIndicator = () => {
        if (rankDiff > 0) {
            return (
                <Box
                    position="absolute"
                    top={"-12px"}
                    left={isCurrentUser ? "25%" : "30%"}
                >
                    <Image
                        src={"/images/Streams/StreamChat/rank-up.svg"}
                        alt={`Rank up`}
                        h={"12px"}
                        w={"12px"}
                    />
                </Box>
            );
        } else if (rankDiff < 0) {
            return (
                <Box
                    position="absolute"
                    bottom="-12px"
                    left={isCurrentUser ? "30%" : "55%x"}
                >
                    <Image
                        src={"/images/Streams/StreamChat/rank-down.svg"}
                        alt={`Rank up`}
                        h={"12px"}
                        w={"12px"}
                    />
                </Box>
            );
        }
        return null;
    };

    const getTextSize = () => {
        let size = 1;
        const rank = leader.Rank;
        if (rank >= 100000) {
            size = 0.7;
        } else if (rank >= 10000) {
            size = 0.75;
        } else if (rank >= 1000) {
            console.log("leader", leader);
            size = 0.8;
        } else if (rank >= 100) {
            size = 0.92;
        }

        if (isCurrentUser) {
            size += 0.1;
        }
        return `${size}em`;
    };

    return (
        <Flex
            id="leaderboardEntry"
            alignItems="left"
            justifyContent={"start"}
            w="full"
            zIndex={10}
            position="relative"
            pt={0}
            pr={1}
            pb={1}
            bgColor={isCurrentUser ? "#555" : "111"}
        >
            <Flex
                id="rank"
                position="absolute"
                top={1}
                left={0.5}
                zIndex={20}
                alignItems="left"
                justifyContent="left"
                w={{ base: "12px", md: "16px" }}
                h={{ base: "12px", md: "16px" }}
                bgGradient={""}
                borderRadius={isCurrentUser ? "8px" : ""}
            >
                <Text
                    id="rankText"
                    color={"white"}
                    fontSize={{ base: "9px", md: "11px" }}
                    lineHeight="1"
                >
                    {leader.Rank < 10 ? `0${leader.Rank}` : leader.Rank}
                </Text>
                {!leader.isPlaceholder && <RankChangeIndicator />}
            </Flex>

            <Tooltip
                label={leader.isPlaceholder ? "" : userName}
                placement="right"
            >
                <Flex id="avatarAndUserName">
                    <Box position="relative" id="avatar" pt={"5px"} ml={4}>
                        <Avatar
                            size={{
                                base: "xs",
                                md: "sm",
                            }}
                            name={userName}
                            src={leader.isPlaceholder ? undefined : pfpUrl}
                            bg={
                                leader.isPlaceholder
                                    ? LEADERBOARD_PLACEHOLDER_COLOR
                                    : undefined
                            }
                            icon={<></>}
                            sx={{
                                ...(isCurrentUser &&
                                    !leader.isPlaceholder && {
                                        borderColor: "transparent",
                                        background: `linear-gradient(to bottom right, ${LEADERBOARD_AVATAR_BG_COLOR1}, ${LEADERBOARD_AVATAR_BG_COLOR2}) border-box`,
                                    }),
                            }}
                            position="relative"
                        />
                    </Box>
                    <Box
                        pt={"2px"}
                        mt={0}
                        ml={1}
                        fontSize={{
                            base: "xx-small",
                            md: "xs",
                        }}
                    >
                        {shortUserName}
                        <br />
                        {leader.Score > 0 ? formattedScore : ""}
                    </Box>
                </Flex>
            </Tooltip>
        </Flex>
    );
};

const ChatLeaderboard: React.FC<ChatLeaderboardProps> = ({
    leaders,
    currentUserId,
}) => {
    //currentUserId = "6750ca3d5626b41c90098869";
    const TOP_LEADERS_COUNT = useBreakpointValue({ base: 3, md: 10 }) ?? 3;

    if (!leaders) {
        return null;
    }

    const leadersSorted = [...leaders].sort((a, b) => a.Rank - b.Rank);
    const currentUserIndex = leadersSorted.findIndex(
        (leader) => leader.UserId === currentUserId
    );

    const createPlaceholderLeader = (rank: number) => ({
        Rank: rank,
        PreviousRank: rank,
        UserId: `placeholder-${rank}`,
        Username: "",
        PfpImageUrl: "",
        Score: 0,
        isPlaceholder: true,
    });

    const createPlaceholderLeaders = (startRank: number, count: number) => {
        return Array.from({ length: count }, (_, index) =>
            createPlaceholderLeader(startRank + index)
        );
    };

    const getTopLeadersWithPlaceholders = () => {
        // Get base top leaders, add 2 in case user is 2nd or 3rd to last
        let topLeaders = leadersSorted.slice(0, TOP_LEADERS_COUNT + 2);

        // Add placeholders if needed
        const placeholdersNeeded = TOP_LEADERS_COUNT + 2 - topLeaders.length;
        if (placeholdersNeeded > 0) {
            topLeaders = [
                ...topLeaders,
                ...createPlaceholderLeaders(
                    topLeaders.length + 1,
                    placeholdersNeeded
                ),
            ];
        }

        return topLeaders;
    };

    const getLeaderboardDisplay = () => {
        let topLeaders = getTopLeadersWithPlaceholders();

        // Handle case when user is near the end of top leaders
        if (
            currentUserIndex === TOP_LEADERS_COUNT - 1 ||
            currentUserIndex === TOP_LEADERS_COUNT
        ) {
            return topLeaders.slice(0, currentUserIndex + 2);
        }

        topLeaders = topLeaders.slice(0, TOP_LEADERS_COUNT);

        // Return early if user is unranked or in top leaders
        if (currentUserIndex < 0 || currentUserIndex < TOP_LEADERS_COUNT) {
            return topLeaders;
        }

        // Add user and surrounding competitors
        let additionalLeaders = leadersSorted.slice(
            currentUserIndex - 1,
            currentUserIndex + 2
        );

        if (additionalLeaders.length < 3) {
            additionalLeaders = [
                ...additionalLeaders,
                createPlaceholderLeader(
                    leadersSorted[currentUserIndex].Rank + 1
                ),
            ];
        }

        return [...topLeaders, ...additionalLeaders];
    };

    const leaderboardDisplay = getLeaderboardDisplay();
    let displayDivider = false;
    if (leaderboardDisplay.length === TOP_LEADERS_COUNT + 3) {
        displayDivider = true;
    }

    return (
        <Box
            position="relative"
            w="95%"
            minH="min-content"
            ml="auto"
            mr="0"
            style={{
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(2px)",
                zIndex: 1,
            }}
        >
            {/* Background component */}
            <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                width={"100%"}
                bg="rgba(26, 26, 26, 0.2)"
                borderRadius="md"
                zIndex={1}
            />

            <VStack
                align="stretch"
                w="100%"
                id="leaderboard"
                minH="min-content"
                spacing={0}
            >
                <VStack
                    align="stretch"
                    spacing={0.5}
                    flex={1}
                    justifyContent="space-around"
                    pb={2}
                >
                    {leaderboardDisplay.map((leader, index) => (
                        <Box key={`${leader.UserId}-${index}`}>
                            {displayDivider &&
                                index === leaderboardDisplay.length - 3 && (
                                    <Divider
                                        borderColor="white"
                                        borderWidth="1px"
                                        opacity={0.8}
                                        w="90%"
                                        mx="auto"
                                    />
                                )}
                            <LeaderboardEntry
                                leader={leader}
                                isCurrentUser={leader.UserId === currentUserId}
                            />
                        </Box>
                    ))}
                </VStack>
            </VStack>
        </Box>
    );
};

export default ChatLeaderboard;
