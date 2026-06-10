"use client";
import { HStack, Flex } from "@chakra-ui/react";
import { FC, ReactNode } from "react";

interface IDashboardTopLayoutProps {
    leftChildren?: ReactNode;
    rightChildren?: ReactNode;
}

const DashboardTopLayout: FC<IDashboardTopLayoutProps> = ({
    leftChildren,
    rightChildren,
}) => {
    return (
        <HStack
            mt="6"
            mb="12"
            justify="space-between"
            flexDir={{
                base: "column",
                md: "row",
            }}
            alignItems={{
                base: "flex-start",
                md: "center",
            }}
        >
            <HStack>{leftChildren}</HStack>
            <Flex
                gap="4"
                w={{
                    base: "full",
                    md: "auto",
                }}
            >
                {rightChildren}
            </Flex>
        </HStack>
    );
};
export default DashboardTopLayout;
