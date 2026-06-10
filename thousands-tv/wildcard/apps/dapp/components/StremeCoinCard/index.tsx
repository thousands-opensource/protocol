import {
    THEME_COLOR_CLOUD_GREY,
    THEME_COLOR_DARK_ONYX,
    THEME_COLOR_YELLOW_DARK,
} from "@/constants/constants";
import { MarketOrder } from "@/features/Stream";
import {
    Text,
    Image,
    Card,
    Stack,
    CardBody,
    Flex,
    useToast,
    Spinner,
    VStack,
} from "@chakra-ui/react";
import { Dispatch, SetStateAction, useState } from "react";

interface StremeCoinCardProps {
    stremeCoin: string;
    actionLabel: string;
    setStremeCoin: Dispatch<SetStateAction<string>>;
    setMarketOrderEntry: Dispatch<SetStateAction<MarketOrder>>;
}

const StremeCoinCard = ({
    stremeCoin,
    actionLabel,
    setStremeCoin,
    setMarketOrderEntry,
}: StremeCoinCardProps) => {
    const toast = useToast();

    const actionLabelArray = actionLabel.split(":");
    const marketOrderText =
        actionLabelArray[0] === MarketOrder.BUY ? "Bought" : "Sold";
    const quantity = actionLabelArray[1];

    const handleCardClick = async () => {
        try {
            setMarketOrderEntry(MarketOrder.BUY);
            setStremeCoin(stremeCoin);
        } catch (e: any) {
            const errMsg = `Error failed to set buy order for ${stremeCoin}`;
            console.error(errMsg, e);
            toast({
                description: `${errMsg}: ${e.message}`,
                status: "error",
                duration: 5000,
                position: "top",
            });
        } finally {
        }
    };

    return (
        <Card
            direction={"row"}
            variant="outline"
            backgroundColor={THEME_COLOR_DARK_ONYX}
            maxW={"265px"}
            cursor={"pointer"}
            onClick={handleCardClick}
            position="relative"
        >
            <Image
                objectFit="contain"
                maxH="60px"
                maxW="60px"
                src={"/images/goalieko.png"}
                alt="cheer"
            />

            <Stack w={"205px"}>
                <CardBody py={0} px={"0px"} h="100%">
                    <Flex
                        sx={{
                            flexDirection: "row",
                            w: "100%",
                            h: "100%",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text
                            fontSize={"14px"}
                            sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                p: 4,
                            }}
                        >{`${marketOrderText} ${quantity} ${stremeCoin}`}</Text>
                    </Flex>
                </CardBody>
            </Stack>
        </Card>
    );
};

export default StremeCoinCard;
