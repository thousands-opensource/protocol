import { getEnvironment } from "@/utils/environmentUtil";
import { Button } from "@chakra-ui/react";
import { Environment } from "@repo/interfaces";
import { useState } from "react";
import { CriticalErrorPattern } from "../ErrorBoundary";

/**
 * Component that can be added anywhere in your app to test error boundaries.
 * @dev - Only include this in development builds.
 */
const ErrorTrigger = () => {
    const [shouldCrash, setShouldCrash] = useState(false);

    if (shouldCrash) {
        // This will trigger the error boundary
        throw new Error(CriticalErrorPattern.MAXIMUM_CALL_STACK);
    }

    if (getEnvironment() !== Environment.LOCAL) {
        return;
    }

    return (
        <Button
            bg="red"
            position="fixed"
            bottom="20px"
            right="20px"
            zIndex={1000}
            colorScheme="red"
            size="sm"
            color={"white"}
            onClick={() => setShouldCrash(true)}
        >
            Test Error Boundary
        </Button>
    );
};

export default ErrorTrigger;
