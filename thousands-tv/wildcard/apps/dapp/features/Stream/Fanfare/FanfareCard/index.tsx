import {
    THEME_COLOR_DARK_GOLDEN_YELLOW,
    WILDFILE_ASSETS_BADGE_DIRECTORY,
} from "@/constants/constants";
import { BADGE_MULTIPILIER } from "@/constants/stream";
import BadgeAvatar from "@/features/Wildfile/WildFileProfile/Badge/BadgeAvatar";
import { getBadgeId } from "@/utils/util";
import { Box, Button, Flex, Image, Text, Tooltip } from "@chakra-ui/react";
import { IBadge } from "@repo/interfaces";
import { Dispatch, ReactNode, SetStateAction } from "react";
import { FaStore } from "react-icons/fa";

interface FanfareCardProps {
    isPersonal: boolean;
    text: string;
    credit: number;
    children: ReactNode | ReactNode[];
    badges: IBadge[];
    setOpenStore: Dispatch<SetStateAction<boolean>>;
}

const FanfareCard = ({
    isPersonal,
    text,
    credit,
    badges,
    setOpenStore,
    children,
}: FanfareCardProps) => {
    const renderBadges = () => {
        if (isPersonal) {
            return badges.map((badge: IBadge, index) => {
                const badgeId = getBadgeId(badge.id, []);
                const multiplier = BADGE_MULTIPILIER[badge.id];

                return (
                    <Tooltip
                        hasArrow
                        label={`${badge.name} - ${multiplier}x`}
                        placement="top"
                        key={badgeId}
                    >
                        <Box
                            loading="lazy"
                            as={Image}
                            sx={{
                                h: 25,
                                w: 25,
                            }}
                            src={`${WILDFILE_ASSETS_BADGE_DIRECTORY}/${badgeId}.webp`}
                            fallbackSrc={`${WILDFILE_ASSETS_BADGE_DIRECTORY}/fallback.webp`}
                        />
                    </Tooltip>
                );
            });
        }

        return null;
    };

    const renderMultiplier = () => {
        const multiplier = badges.length ? Math.ceil(badges.length * 0.5) : 1;
        if (isPersonal) {
            if (badges.length === 0) {
                return null;
            }

            return (
                <Text color={THEME_COLOR_DARK_GOLDEN_YELLOW}>
                    x{multiplier}
                </Text>
            );
        }

        return null;
    };

    const renderStore = () => {
        if (!isPersonal) {
            return (
                <Button
                    leftIcon={<FaStore />}
                    onClick={() => {
                        setOpenStore(true);
                    }}
                >
                    Store/Mint Collectible NFT
                </Button>
            );
        }

        return <Text fontSize={"md"}>{credit}</Text>;
    };

    return (
        <Flex
            key={text}
            sx={{
                flexDirection: "column",
                backgroundColor: "var(--chakra-colors-blue-800)",
                padding: 2,
                alignItems: "flex-start",
                borderRadius: "12px",
                h: "80px",
            }}
        >
            <Flex
                sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    w: "100%",
                }}
            >
                <Flex sx={{ gap: 2 }}>
                    <Text fontSize={"lg"}>{text}</Text>
                    <Flex sx={{ gap: 2 }}>{renderBadges()}</Flex>
                </Flex>
                <Flex sx={{ gap: 2, alignItems: "center" }}>
                    {renderMultiplier()}
                    {renderStore()}
                </Flex>
            </Flex>
            <Flex sx={{ gap: 2, alignItems: "center" }}>{children}</Flex>
        </Flex>
    );
};

export default FanfareCard;
