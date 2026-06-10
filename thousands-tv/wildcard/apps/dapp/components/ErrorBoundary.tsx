import React, { Component, ErrorInfo, ReactNode } from "react";
import StreamLayout from "@/layouts/StreamLayout";
import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { RefreshCw } from "lucide-react";
import { THEME_COLOR_SECONDARY } from "@/constants";
import { getEnvironment } from "@/utils/environmentUtil";
import { Environment } from "@repo/interfaces";

/**
 * Enum for critical error patterns that should trigger the error boundary
 */
export enum CriticalErrorPattern {
    // Next.js client-side exception
    CLIENT_SIDE_EXCEPTION = "client-side exception",

    // React infinite loop errors
    MAXIMUM_UPDATE_DEPTH = "Maximum update depth exceeded",
    MAXIMUM_CALL_STACK = "Maximum call stack size exceeded",
}

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

/**
 * Error boundary component that only shows error UI for critical React rendering errors.
 * It will not interfere with normal application error handling.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Check if error message includes any of the critical patterns
        const isCriticalError =
            error &&
            Object.values(CriticalErrorPattern).some((pattern) =>
                error.message.includes(pattern)
            );

        if (isCriticalError) {
            console.error(
                "Critical application error caught by ErrorBoundary:",
                error
            );
            return { hasError: true };
        }

        throw error;
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log the error Sentry
        console.error("Caught in ErrorBoundary:", error);

        // In development, show more detailed error info
        if (getEnvironment() === Environment.LOCAL) {
            console.error("Component stack:", errorInfo.componentStack);
        }
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <StreamLayout>
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        minHeight="60vh"
                        p={8}
                    >
                        <VStack
                            spacing={6}
                            align="center"
                            maxW="600px"
                            mx="auto"
                            textAlign="center"
                        >
                            <Heading size="lg" color="white">
                                Oops! Something went wrong
                            </Heading>
                            <Text fontSize="md" color="white">
                                We encountered an issue. This might be due to a
                                temporary glitch or network issue.
                            </Text>
                            <Button
                                leftIcon={<RefreshCw size={18} color="white" />}
                                onClick={() => window.location.reload()}
                                bgColor={THEME_COLOR_SECONDARY}
                                color="white"
                                size="lg"
                                borderRadius="md"
                                fontWeight="bold"
                                px={8}
                                _hover={{
                                    transform: "translateY(-2px)",
                                    boxShadow: "lg",
                                    bgColor: "#c25c41",
                                }}
                                _active={{
                                    bgColor: "#ad4f36",
                                }}
                                transition="all 0.2s"
                            >
                                Reload
                            </Button>
                            <Text fontSize="sm" color="whiteAlpha.700" mt={4}>
                                If the problem persists, please contact
                                community.
                            </Text>
                        </VStack>
                    </Box>
                </StreamLayout>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
