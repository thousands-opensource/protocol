import {
    THEME_COLOR_ERROR_RED,
    THEME_COLOR_ONYX,
    THEME_COLOR_SUCCESS_GREEN,
} from "@/constants/constants";
import { useChatAppMyCoinsContext } from "@/contexts/chatAppMyCoinsContext";
import { useChatAppTopCoinsContext } from "@/contexts/chatAppTopCoinsContext";
import { useChatAppStreamCoinsBuySellContext } from "@/contexts/chatAppStreamCoinsBuySellContext";
import { MarketOrder } from "@/features/Stream";
import { Box, Flex, Text, VStack, Image } from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";

interface CoinPosition {
    dotColor?: string;
    CoinName: string;
    Quantity?: string;
    Price?: number;
}

interface StremeCoinPositionProps {
    coinPosition: CoinPosition;
    category: "my-positions" | "top-positions";
    setStremeCoin: Dispatch<SetStateAction<string>>;
    setOrderEntryQuantity: Dispatch<SetStateAction<number>>;
    setMarketOrderEntry: Dispatch<SetStateAction<MarketOrder>>;
}

const StremeCoinPosition: React.FC<StremeCoinPositionProps> = ({
    coinPosition: { CoinName, Quantity = 0, Price = 0 },
    category,
    setStremeCoin,
    setOrderEntryQuantity,
    setMarketOrderEntry,
}) => {
    const isNegative = Price < 0;

    const coinPositionTextDisplay =
        category === "my-positions" ? "Qty: " + Quantity : Price;

    const marketOrder =
        category === "my-positions" ? MarketOrder.SELL : MarketOrder.BUY;

    const stremeCoinQuantity =
        category === "my-positions" ? Number(Quantity) : 10;

    const handleClickStremeCoinPosition = () => {
        setMarketOrderEntry(marketOrder);
        setOrderEntryQuantity(stremeCoinQuantity);
        setStremeCoin(CoinName);
    };

    return (
        <Flex
            justify="space-between"
            align="center"
            bg={THEME_COLOR_ONYX}
            px={2}
            py={1}
            borderRadius="full"
            w="100%"
            gap={9}
            cursor="pointer"
            onClick={handleClickStremeCoinPosition}
        >
            <Flex align="center" gap={2}>
                <Box w={4} h={4} borderRadius="full" />
                <Text fontSize={"12px"} color="lightgray">
                    {CoinName}
                </Text>
            </Flex>
            <Flex align="center" gap={1}>
                {/*isNegative ? (
                    <FaArrowTrendDown
                        size={".5em"}
                        color={THEME_COLOR_ERROR_RED}
                    />
                ) : (
                    <FaArrowTrendUp
                        size={".5em"}
                        color={THEME_COLOR_SUCCESS_GREEN}
                    />
                )*/}
                <Text
                    fontSize={"12px"}
                    color={
                        "white"
                        /*isNegative
                            ? THEME_COLOR_ERROR_RED
                            : THEME_COLOR_SUCCESS_GREEN*/
                    }
                >
                    {coinPositionTextDisplay}
                </Text>
                {category !== "my-positions" && (
                    <Image
                        src="/images/Credits/coin.webp"
                        alt="Credits"
                        width={4}
                        height={4}
                        className="w-3 h-3"
                    />
                )}
            </Flex>
        </Flex>
    );
};

interface ChipListProps {
    category: "my-positions" | "top-positions";
}

const MyCoinPositions: React.FC<ChipListProps> = ({ category }) => {
    const { setMarketOrderEntry, setStremeCoin, setOrderEntryQuantity } =
        useChatAppStreamCoinsBuySellContext();
    const { myCoinPositions } = useChatAppMyCoinsContext();
    const { topCoinPositions } = useChatAppTopCoinsContext();
    const renderCoinPosition = () => {
        if (category === "my-positions") {
            return myCoinPositions.map((position: any, index) => (
                <StremeCoinPosition
                    key={index}
                    coinPosition={position}
                    category={category}
                    setStremeCoin={setStremeCoin}
                    setOrderEntryQuantity={setOrderEntryQuantity}
                    setMarketOrderEntry={setMarketOrderEntry}
                />
            ));
        }

        return topCoinPositions.map((position: any, index) => (
            <StremeCoinPosition
                key={index}
                coinPosition={position}
                category={category}
                setStremeCoin={setStremeCoin}
                setOrderEntryQuantity={setOrderEntryQuantity}
                setMarketOrderEntry={setMarketOrderEntry}
            />
        ));
    };
    return (
        <Box
            px={4}
            p={2}
            borderRadius="xl"
            maxW="md"
            h="140px"
            overflowY="auto"
        >
            {/* <Text color="lightgray" mb={3}>
                My Positions
            </Text> */}
            <VStack spacing={2}>{renderCoinPosition()}</VStack>
        </Box>
    );
};

export default MyCoinPositions;
