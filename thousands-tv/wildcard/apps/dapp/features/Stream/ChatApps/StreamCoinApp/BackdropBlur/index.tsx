import { useConfirmationContext } from "@/contexts/confirmationContext";
import { useStreamContext } from "@/contexts/streamContext";
import { Box } from "@chakra-ui/react";
import { ChatApp } from "@repo/interfaces";

const BackdropBlur = () => {
    const { chatApp } = useStreamContext();
    const { openPopup } = useConfirmationContext();

    if (chatApp !== ChatApp.STREMECOIN) {
        return null;
    }

    return (
        <Box
            sx={{
                display: openPopup ? "block" : "none",
                h: "100%",
                w: "100%",
                position: "absolute",
                backgroundColor: "#18182D",
                opacity: 0.65,
                backdropFilter: "blur(2.5px)",
                zIndex: "var(--chakra-zIndices-modal)",
                cursor: openPopup ? "not-allowed" : "default",
            }}
        />
    );
};
export default BackdropBlur;
