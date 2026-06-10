import { Flex } from "@chakra-ui/react";
import { ReactNode } from "react";

interface StreamLayoutProps {
    children?: ReactNode;
}

const StreamLayout = ({ children }: StreamLayoutProps) => {
    return (
        <Flex
            sx={{
                height: "100vh",
                overflow: "hidden",
                backgroundColor: "black",
                flexDirection: "column",
            }}
        >
            {children}
        </Flex>
    );
};

export default StreamLayout;
