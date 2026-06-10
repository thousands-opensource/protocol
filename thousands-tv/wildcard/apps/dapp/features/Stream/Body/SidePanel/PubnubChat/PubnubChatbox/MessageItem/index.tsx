import { ReactNode, useState } from "react";
import { HexagonSVGAvatarPFP } from "@/components/SVGImages";
import { poppinsBold, poppinsMedium } from "@/utils/themeUtil";
import { shorten } from "@/utils/util";
import { Flex, Box, Text } from "@chakra-ui/react";
import {
    getPredefinedColor,
    getNameInitials,
} from "@pubnub/react-chat-components";

interface MessageItemProps {
    time: string;
    name: string;
    pfp: string;
    children: ReactNode | ReactNode[];
}
const MessageItem = ({ time, name, pfp, children }: MessageItemProps) => {
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);

    const renderAvatar = () => {
        if (!pfp) {
            return (
                <Box
                    className="pn-msg__avatar"
                    backgroundColor={getPredefinedColor(name)}
                    sx={{ minW: "38px", w: "38px", m: 0 }}
                >
                    {getNameInitials(name)}
                </Box>
            );
        }

        return (
            <Box sx={{ minW: "38px", w: "38px" }}>
                <HexagonSVGAvatarPFP
                    srcUrl={pfp}
                    scaleFactor={0.95} // custom scale for the image to fit inside the hexagon border
                    setImageLoaded={setImageLoaded}
                    imageLoaded={imageLoaded}
                    h={"38px"}
                    w={"38px"}
                    minH={"38px"}
                    minW={"38px"}
                    id={"chat-message-pfp"}
                />
            </Box>
        );
    };

    // display name max length 16, taking account biggest character width
    const displayName = shorten(name, { length: 16 });

    return (
        <Flex gap={"10px"}>
            {renderAvatar()}
            <Flex flexDirection={"column"}>
                <Flex flexDirection={"row"} alignItems={"center"}>
                    <Text
                        as={"span"}
                        className={`pn-msg__author ${poppinsBold.className}`}
                        sx={{
                            fontSize: "12px",
                        }}
                    >
                        {displayName}
                    </Text>
                    <Text
                        as={"span"}
                        className={`pn-msg__time ${poppinsMedium.className}`}
                        sx={{ fontSize: "10px", color: "#A7A7A6" }}
                    >
                        {time}
                    </Text>
                </Flex>
                {children}
            </Flex>
        </Flex>
    );
};
export default MessageItem;
