import { useConfirmationContext } from "@/contexts/confirmationContext";
import { useStreamContext } from "@/contexts/streamContext";
import {
    Box,
    Flex,
    Center,
    Spinner,
    ButtonGroup,
    Button,
    Text,
    SystemStyleObject,
} from "@chakra-ui/react";
import { ChatApp } from "@repo/interfaces";
import { Dispatch, SetStateAction } from "react";
import { MarketOrder } from "..";
import { useChatAppStreamCoinsBuySellContext } from "@/contexts/chatAppStreamCoinsBuySellContext";

interface PlaceOrderPopupProps {
    handleConfirm: () => Promise<void>;
    sx?: SystemStyleObject;
}

const PlaceOrderPopup = ({ handleConfirm, sx }: PlaceOrderPopupProps) => {
    const { chatApp } = useStreamContext();
    const { setMarketOrderEntry } = useChatAppStreamCoinsBuySellContext();
    const {
        setOpenPopup,
        isLoadingConfirmation,
        isLoadingFetchPriceQuote,
        isOrderCompleted,
        errorMessage,
        popupMessage,
        setIsOrderCompleted,
    } = useConfirmationContext();
    const isLoading = isLoadingConfirmation || isLoadingFetchPriceQuote;

    const handleClosePopup = () => {
        if (chatApp === ChatApp.STREMECOIN) {
            setMarketOrderEntry(MarketOrder.NONE);
        }

        if (chatApp === ChatApp.WILDCARD) {
        }

        setOpenPopup(false);
        setIsOrderCompleted(false);
    };
    return (
        <Flex
            sx={{
                ...sx,
                w: "100%",
                border: "1px solid gray",
                borderRadius: "16px",
                flexDirection: "column",
                justifyContent: "center",
                p: "16px",
                py: "16px",
                gap: "8px",
                minH: "110px",
            }}
        >
            {isLoading ? (
                <Center>
                    <Spinner />
                </Center>
            ) : (
                <>
                    <Box
                        sx={{
                            fontSize: "12px",
                        }}
                    >
                        <Text
                            sx={{
                                color: "red",
                            }}
                        >
                            {errorMessage}
                        </Text>
                        {popupMessage}
                    </Box>
                    <Box
                        sx={{
                            w: "100%",
                        }}
                    >
                        <ButtonGroup
                            sx={{
                                w: "100%",
                            }}
                            size={"sm"}
                            variant="outline"
                        >
                            {isOrderCompleted ? (
                                <Button
                                    sx={{
                                        w: "100%",
                                        color: "white",
                                        bgColor: "red",
                                    }}
                                    onClick={handleClosePopup}
                                >
                                    Close
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        sx={{
                                            w: "100%",
                                            color: "white",
                                            bgColor: "red",
                                        }}
                                        onClick={() => setOpenPopup(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        sx={{
                                            w: "100%",
                                            color: "white",
                                            bgColor: "green",
                                        }}
                                        onClick={handleConfirm}
                                    >
                                        Confirm
                                    </Button>
                                </>
                            )}
                        </ButtonGroup>
                    </Box>
                </>
            )}
        </Flex>
    );
};

export default PlaceOrderPopup;
