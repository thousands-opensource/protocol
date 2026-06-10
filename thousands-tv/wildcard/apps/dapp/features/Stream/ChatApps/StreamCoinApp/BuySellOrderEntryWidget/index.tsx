import {
    Box,
    Flex,
    ButtonGroup,
    Button,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    CloseButton,
} from "@chakra-ui/react";
import { MarketOrder } from "../../..";
import { useChatAppStreamCoinsBuySellContext } from "@/contexts/chatAppStreamCoinsBuySellContext";
import { useStreamContext } from "@/contexts/streamContext";
import { ChatApp } from "@repo/interfaces";
import { useConfirmationContext } from "@/contexts/confirmationContext";

const BuySellOrderEntryApp = () => {
    const { chatApp } = useStreamContext();
    const {
        setStremeCoin,
        marketOrderEntry,
        setMarketOrderEntry,
        orderEntryQuantity,
        setOrderEntryQuantity,
    } = useChatAppStreamCoinsBuySellContext();

    const handleChangeOrderEntryQuantity = (
        valueAsString: string,
        valueAsNumber: number
    ) => setOrderEntryQuantity(!valueAsString ? 1 : valueAsNumber);

    if (chatApp !== ChatApp.STREMECOIN) {
        return null;
    }

    if (marketOrderEntry === MarketOrder.NONE) {
        return null;
    }

    return (
        <Flex
            sx={{
                justifyContent: "space-between",
                alignItems: "center",
                w: "100%",
                mt: 4,
            }}
        >
            <Box>
                <ButtonGroup size={"sm"} isAttached variant="outline">
                    <Button
                        sx={{
                            w: "100%",
                            color: "white",
                            bgColor:
                                marketOrderEntry === MarketOrder.BUY
                                    ? "green"
                                    : "gray",
                        }}
                        onClick={() => setMarketOrderEntry(MarketOrder.BUY)}
                    >
                        Buy
                    </Button>
                    <Button
                        sx={{
                            w: "100%",
                            color: "white",
                            bgColor:
                                marketOrderEntry === MarketOrder.SELL
                                    ? "red"
                                    : "gray",
                        }}
                        onClick={() => setMarketOrderEntry(MarketOrder.SELL)}
                    >
                        Sell
                    </Button>
                </ButtonGroup>
            </Box>
            <Box>
                <NumberInput
                    value={orderEntryQuantity}
                    max={99999}
                    min={1}
                    fontSize={"12px"}
                    size={"sm"}
                    width={"auto"}
                    keepWithinRange={true}
                    clampValueOnBlur={false}
                    onChange={handleChangeOrderEntryQuantity}
                >
                    <NumberInputField placeholder="Enter amount shares" />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
            </Box>
            <Box>
                <CloseButton
                    sx={{
                        fontSize: "10px",
                    }}
                    onClick={() => {
                        setMarketOrderEntry(MarketOrder.NONE);
                        setOrderEntryQuantity(10);
                        setStremeCoin("");
                    }}
                />
            </Box>
        </Flex>
    );
};
export default BuySellOrderEntryApp;
