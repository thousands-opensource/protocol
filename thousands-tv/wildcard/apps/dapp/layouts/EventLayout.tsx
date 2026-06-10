import { THEME_COLOR_SLIGHT_GREY_BACKGROUND } from "@/constants/constants";
import { Container, Flex } from "@chakra-ui/react";
import { ReactNode } from "react";
interface EventLayoutProps {
    children: ReactNode;
}

const EventLayout = ({ children }: EventLayoutProps) => {
    return (
        <Container
            centerContent
            sx={{
                mb: 0,
                mx: 0,
                minH: "inherit",
                bgColor: THEME_COLOR_SLIGHT_GREY_BACKGROUND,
                height: "auto",
                width: "100%",
                margin: "0 auto",
                display: "flex",
                maxW: "full",
                textTransform: "capitalize",
                minWidth: "320px",
            }}
        >
            {/* Render Profile Inner Contents */}
            <Flex
                sx={{
                    position: "relative",
                    minH: "inherit",
                    borderColor: "whiteAlpha.500",
                    fontWeight: 900,
                    color: "white",
                    alignItems: ["stretch", "stretch", "stretch", "center"],
                    justifyContent: "flex-start",
                    width: "100%",
                    height: "100%",
                    paddingY: "32px",
                    paddingX: "16px",
                    flexDirection: "column",
                }}
            >
                <Flex
                    minH={"100%"}
                    width={"100%"}
                    sx={{
                        flexDirection: "column",
                        alignItems: "center",
                        backgroundImage:
                            "url(/images/WildfileAssets/Background/dotted.png)",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "top center",
                        backgroundSize: "cover",
                        borderColor: "whiteAlpha.500",
                        borderRadius: "3xl",
                        flexGrow: 1,
                    }}
                >
                    {children}
                </Flex>
            </Flex>
        </Container>
    );
};
export default EventLayout;
