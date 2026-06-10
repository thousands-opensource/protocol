import { ReactNode } from "react";
import { Flex, Box, SystemStyleObject } from "@chakra-ui/react";
import SidePanel from "./SidePanel";
import { ICollectible } from "@repo/interfaces";

interface BodyProps {
    children: ReactNode | ReactNode[];
    collectibles: ICollectible[];
    sx?: SystemStyleObject;
}

const Body = ({ sx, children, collectibles }: BodyProps) => {
    const renderDesktopSidePanel = () => {
        return (
            <Flex
                sx={{
                    flexDirection: "column",
                    gap: 1,
                    alignSelf: "flex-start",
                    height: "100%",
                    flexBasis: ["1600px", "1600px", "1600px", "500px"],
                    width: ["100%", "100%", "100%", "auto"],
                    overflow: "hidden",
                }}
            >
                <SidePanel collectibles={collectibles} />
            </Flex>
        );
    };

    return (
        <Flex
            sx={{
                minH: [
                    "calc(100vh - 176px)",
                    "calc(100vh - 176px)",
                    "calc(100vh - 176px)",
                    "calc(100vh - 200px)",
                    "calc(100vh - 200px)",
                ],
                maxH: [
                    "calc(100vh - 176px)",
                    "calc(100vh - 176px)",
                    "calc(100vh - 176px)",
                    "calc(100vh - 200px)",
                    "calc(100vh - 200px)",
                ],
                flexDirection: ["column", "column", "column", "row"],
                position: "relative",
                ...sx,
            }}
            id="stream-body"
        >
            <Flex
                sx={{
                    flexDirection: ["column", "column", "column", "row"],
                    // justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    minH: "inherit",
                    maxH: "inherit",
                    // flexGrow: [1, 1, 1, "initial"],
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        height: "100%",
                        "& video": {
                            objectFit: "contain",
                        },
                    }}
                >
                    {children}
                </Box>
                {renderDesktopSidePanel()}
            </Flex>
        </Flex>
    );
};

export default Body;
