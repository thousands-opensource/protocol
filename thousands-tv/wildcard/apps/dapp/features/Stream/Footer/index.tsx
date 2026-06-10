import { useRef } from "react";
import { THEME_COLOR_CLOUD_GREY } from "@/constants/constants";
import { Flex, Box, useBreakpointValue } from "@chakra-ui/react";
import { useStreamContext } from "@/contexts/streamContext";
import PubnubChatInput from "./PubnubChatInput";

const Footer = () => {
    const { selectedChatAction } = useStreamContext();
    const pubnubInputRef = useRef<HTMLDivElement | null>(null);
    const borderLeft = useBreakpointValue(
        {
            base: "none",
            sm: "none",
            md: "none",
            lg: `1px solid ${THEME_COLOR_CLOUD_GREY}`,
        },
        {
            fallback: "md",
        }
    );

    return (
        <Flex
            id="footer"
            sx={{
                alignItems: "center",
                height: ["88px", "88px", "88px", "110px"],
                backgroundColor: "#1E1E1E",
            }}
        >
            <Box
                sx={{
                    display: ["none", "none", "none", "block"],
                    width: "100%",
                    flexGrow: 1,
                }}
                height={"100%"}
            />
            <Flex
                ref={pubnubInputRef}
                sx={{
                    flexBasis: "500px",
                    flexGrow: 1,
                    borderLeft: borderLeft,
                    width: "100%",
                    flexDirection: "column",
                    justifyContent: "center",
                    height: "100%",
                    "& .pn-msg-input": {
                        backgroundColor: "#1E1E1E",
                        width: "100%",
                    },
                    "& .pn-msg-input__textarea": {
                        backgroundColor: "#232323",
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        margin: 0,
                        border: "1px solid #343435",
                        borderRight: "transparent",
                        borderTopLeftRadius: selectedChatAction
                            ? "none"
                            : "var(--msg-input__textarea__borderRadius)",
                        overflowX: "auto",
                        whiteSpace: "nowrap",
                        scrollbarWidth: "thin",
                    },
                    "& .pn-msg-input__icons": {
                        backgroundColor: "#232323",
                        height: "32px",
                        border: "1px solid #343435",
                        borderLeft: "transparent",
                        borderRight: "transparent",
                        "& button": {
                            margin: "0 4px",
                            color: "white",
                        },
                    },
                    "& .pn-msg-input__emoji-toggle": {
                        display: "flex",
                        "& svg": {
                            verticalAlign: "middle",
                            width: "1em",
                            height: "1em",
                            display: "inline-block",
                            lineHeight: "1em",
                            flexShrink: 0,
                            fontSize: "x-large",
                        },
                    },
                    "& .pn-msg-input__emoji-picker": {
                        bottom: "40px",
                        right: 0,
                    },
                    "& .special-actions": {
                        borderRadius: "24px",
                        border: "2px solid #ED7E5F",
                    },
                    "& .chatActionCredit": {
                        borderRadius: "24px",
                        border: "2px solid white",
                        fontSize: "x-small",
                        color: "unset",
                    },
                    "& .pn-msg-input__send--active": {
                        color: THEME_COLOR_CLOUD_GREY,
                    },
                    "& .pn-msg-input__send": {
                        borderTopRightRadius: selectedChatAction
                            ? "none"
                            : "var(--msg-input__textarea__borderRadius)",
                        borderBottomRightRadius:
                            "var(--msg-input__textarea__borderRadius)",
                        border: "1px solid #343435",
                        height: "32px",
                        borderLeft: "transparent",
                        margin: "0",
                        marginLeft: "-2px",
                        backgroundColor: "#232323",
                        padding: "0px 6px",
                    },
                }}
            >
                <PubnubChatInput pubnubInputRef={pubnubInputRef} />
            </Flex>
        </Flex>
    );
};

export default Footer;
