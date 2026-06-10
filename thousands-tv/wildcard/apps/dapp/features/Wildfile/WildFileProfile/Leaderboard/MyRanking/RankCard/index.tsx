import { gilroyHeavy, wildleagueBold, gilroyRegular } from "@/utils/themeUtil";
import { getTrophyImg } from "@/utils/util";
import {
    Card,
    CardBody,
    Heading,
    Flex,
    Box,
    Text,
    Image,
} from "@chakra-ui/react";
import { RankImprovementStatus } from "..";
import { leaderboardTabStyles, mainTabStyles } from "../styles";
import { ChakraNextImageSimple } from "@/components/Image/ChakraNextImageSimple";

interface RankCardProps {
    leaderboardId: string;
    rank: number;
    leaderboardLabel: string;
    score: number;
    rankImprovement: RankImprovementStatus;
    backgroundColor: string;
    isFitToAccordion: boolean;
}

/**
 * Renders a rank card contains rank, score, rank status, and etc...
 */
const RankCard = ({
    leaderboardId,
    rank,
    leaderboardLabel,
    score,
    rankImprovement,
    backgroundColor,
    isFitToAccordion,
}: RankCardProps) => {
    // Check rank is within top three
    const isTopThreeRank = 1 <= rank && rank < 4;
    // Specific styles for specific rank card
    const styles = isFitToAccordion ? mainTabStyles : leaderboardTabStyles;
    // Determines what img/svg to provide to tab
    const tabDirectory = isFitToAccordion ? "main" : "leaderboard";
    // Check is beyond 1,000 place (inclusively)
    const isBeyondThousand = rank > 999;

    /**
     * Get formatted rank disregarding the hundredth place when rank is beyond 1,000th place
     * e.g 1,234 -> 001k
     * @returns formatted rank with three 0's leading
     */
    const getFormattedRank = () => {
        if (rank < 1000) {
            return rank.toString();
        }

        const maxFormattedRank = 999;
        const estimatedRank = Math.floor(rank / 1000);
        if (estimatedRank > maxFormattedRank) {
            return maxFormattedRank.toString();
        }

        return estimatedRank.toString();
    };

    /**
     * Render styled rank
     * @returns rank
     */
    const renderFormattedRank = () => {
        const formattedRank = getFormattedRank();
        const totalMissingLeadingZeros = 3 - formattedRank.length;
        const newFormattedRank = formattedRank.padStart(3, "0");
        const formattedRankList = newFormattedRank.split("");
        let numMissingLeadingZeros = 0;
        return formattedRankList.map((digit, index) => {
            let useDarkColor = false;
            if (numMissingLeadingZeros < totalMissingLeadingZeros) {
                useDarkColor = true;
                numMissingLeadingZeros += 1;
            }

            return (
                <Heading
                    key={`${tabDirectory}-${formattedRank}-${index}`}
                    sx={styles.rankSx(useDarkColor)}
                >
                    {digit}
                </Heading>
            );
        });
    };

    /**
     * Render "K" to represent the rank has exceed 1,000th place
     * @returns character "K"
     */
    const renderKIndicator = () => {
        if (!isBeyondThousand) {
            return null;
        }

        return (
            <Text
                casing="uppercase"
                sx={styles.kIndicator}
                className={wildleagueBold.className}
            >
                k
            </Text>
        );
    };

    /**
     * Render two arrow up/down depending on the improvements from previous and current rank
     * @returns two arrow up/down image
     */
    const renderRankImprovement = () => {
        switch (rankImprovement) {
            case RankImprovementStatus.RANK_UP:
                return (
                    <Image
                        alt={"rank up"}
                        src={"/images/WildfileAssets/Leaderboard/Rank_Up.svg"}
                        sx={styles.rankUpSx}
                    />
                );
            case RankImprovementStatus.RANK_DOWN:
                return (
                    <Image
                        alt={"rank down"}
                        src={"/images/WildfileAssets/Leaderboard/Rank_Down.svg"}
                        sx={styles.rankDownSx}
                    />
                );
            default:
                return <></>;
        }
    };

    return (
        <Card
            sx={styles.cardSx}
            key={`${tabDirectory}-${leaderboardLabel}-${rank}`}
        >
            <CardBody sx={styles.cardBodySx(backgroundColor)}>
                <Box sx={styles.rankContainerSx}>
                    <Text
                        casing="uppercase"
                        sx={styles.rankLabelSx}
                        className={gilroyHeavy.className}
                    >
                        Rank
                    </Text>
                    <Flex>{renderFormattedRank()}</Flex>
                    <Text
                        className={gilroyRegular.className}
                        sx={styles.scoreSx}
                        hidden={isFitToAccordion}
                    >
                        {score} Pts
                    </Text>
                </Box>
                <Flex sx={styles.lowerContainerSx}>
                    <Flex sx={styles.badgeContainerSx}>
                        <ChakraNextImageSimple
                            src={styles.getIconSrc(leaderboardId)}
                            alt="alpha series zero"
                            sx={styles.avatarSx}
                            height={50}
                            width={50}
                        />
                    </Flex>
                    <Flex sx={styles.leaderboardLabelContainerSx}>
                        <Text
                            casing="uppercase"
                            className={gilroyHeavy.className}
                            sx={styles.leaderboardLabelSx}
                        >
                            {leaderboardLabel}
                        </Text>
                    </Flex>
                </Flex>
            </CardBody>
            {isTopThreeRank && (
                <Image
                    alt={"trophy"}
                    src={getTrophyImg(tabDirectory, rank)}
                    sx={styles.trophySx}
                />
            )}
            {renderRankImprovement()}
            {renderKIndicator()}
        </Card>
    );
};
export default RankCard;
