import React from "react";
import { Box, Button, Code, Flex, Text, useToast } from "@chakra-ui/react";
import { copyTextToClipboard } from "@/utils/util";
import { EnrichedInsight } from "@/pages/api/pledgeAI/util/topInsightsUtil";

interface InsightsCopyFieldProps {
    insights: EnrichedInsight | null;
}

/**
 * Copy clipboard to copy distribution token for insights
 */
const InsightsCopyField: React.FC<InsightsCopyFieldProps> = ({ insights }) => {
    const toast = useToast();

    if (!insights) return null;
    const insightsJson = JSON.stringify(insights, null, 2);

    const handleCopy = async () => {
        try {
            await copyTextToClipboard(insightsJson);
            toast({
                title: "Copied!",
                description: "Insights have been copied to the clipboard.",
                status: "success",
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to copy insights.",
                status: "error",
                duration: 2000,
                isClosable: true,
            });
        }
    };

    return (
        <Box mt={4}>
            <Flex
                justifyContent="flex-start"
                gap="20px"
                alignItems="center"
                mb={2}
            >
                <Text fontSize="lg" fontWeight="bold">
                    Insights (Copy & Paste)
                </Text>
                <Button onClick={handleCopy}>Copy Insights</Button>
            </Flex>
            <Code whiteSpace="pre-wrap" p={4}>
                {insightsJson}
            </Code>
        </Box>
    );
};

export default InsightsCopyField;
