import { useBoostStore } from "@/store/useBoostStore";
import { Text, Flex, Button } from "@chakra-ui/react";

const TokenRewards = () => {
    const { tokenRewardsTextDisplay, setTokenRewardsTextDisplay } =
        useBoostStore();

    const handleClose = () => {
        setTokenRewardsTextDisplay("");
    };

    if (!Boolean(tokenRewardsTextDisplay)) {
        return null;
    }

    return (
        <Flex
            sx={{
                position: "absolute",
                w: "100%",
                borderRadius: "md",
                color: "white",
                background: "rgba(19, 18, 18)",
                flexDirection: "column",
                bottom: "85px",
                p: 4,
                gap: 2,
                border: `1px solid rgb(56 56 56)`,
                zIndex: "999"
            }}
        >
            <Text fontSize="14px">
                {tokenRewardsTextDisplay.replace("&apos;", "'")}
            </Text>
            <Button
                sx={{
                    minW: "var(--chakra-sizes-8)",
                    height: "var(--chakra-sizes-8)",
                    backgroundColor: "rgb(30 30 30)",
                }}
                onClick={handleClose}
            >
                Close
            </Button>
        </Flex>
    );
};
export default TokenRewards;
