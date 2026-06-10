"use client";
import { Heading } from "@chakra-ui/react";
import React, { ReactNode } from "react";

interface Props {
    children: ReactNode;
}

/**
 * React component that displays a dashboard title.
 */
const DashboardTitle = ({ children }: Props) => {
    return (
        <Heading
            as="h1"
            color="foreground"
            fontSize="28px"
            fontWeight="semibold"
        >
            {children}
        </Heading>
    );
};

export default DashboardTitle;
