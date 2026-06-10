import { Button, Image } from "@chakra-ui/react";

interface FinalizedChatActionBodyProps {
    chatAction: any;
}

const FinalizedChatActionBody = ({
    chatAction,
}: FinalizedChatActionBodyProps) => {
    const { type, optionAImageUrl, optionBImageUrl } = chatAction;
    const targetImage = optionAImageUrl ?? optionBImageUrl;
    if (!["system-yesno", "system-join"].includes(type)) {
        return <></>;
    }

    if (!targetImage) {
        return null;
    }

    return (
        <Image
            loading="lazy"
            objectFit="contain"
            maxH="45px"
            maxW="40px"
            sx={{
                alignSelf: "center",
                borderRadius: "25px",
            }}
            src={targetImage}
            alt="target-image"
        />
    );
};

export default FinalizedChatActionBody;
