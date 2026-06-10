import React from "react";
import { Box, Button, Code, Flex, Text, useToast } from "@chakra-ui/react";
import { copyTextToClipboard } from "@/utils/util";
import { WalletRecipient } from "@/pages/api/pledgeAI/types";

/**
 * Props for the WalletRecipientsCSV component.
 */
export interface WalletRecipientsCSVProps {
    recipients: WalletRecipient[];
}

/**
 * WalletRecipientsCSV displays the provided wallet recipient data in CSV format.
 * It shows a header and the CSV content, and provides buttons to copy the CSV data
 * to the clipboard or download it as a CSV file.
 *
 * @param props - The component props containing an array of wallet recipients.
 * @returns A JSX element displaying the CSV data.
 */
const WalletRecipientsCSV: React.FC<WalletRecipientsCSVProps> = ({
    recipients,
}) => {
    const toast = useToast();

    // Generate CSV string from the recipients array.
    const csvHeader = "Address,Balance";
    const csvRows = recipients.map(
        (recipient) => `${recipient.walletAddress},${recipient.allocatedTokens}`
    );
    const csvContent = [csvHeader, ...csvRows].join("\n");

    /**
     * Handles copying the CSV content to the clipboard.
     */
    const handleCopy = async () => {
        try {
            await copyTextToClipboard(csvContent);
            toast({
                title: "Copied!",
                description: "CSV data has been copied to the clipboard.",
                status: "success",
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to copy CSV data.",
                status: "error",
                duration: 2000,
                isClosable: true,
            });
        }
    };

    /**
     * Handles downloading the CSV content as a file.
     */
    const handleDownload = () => {
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        // Create a temporary link element and trigger a download.
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "wallet_recipients.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Box mt={4}>
            <Flex
                justifyContent="flex-start"
                alignItems="center"
                gap="20px"
                mb={2}
            >
                <Text fontSize="lg" fontWeight="bold">
                    Wallet Recipients (CSV)
                </Text>
                <Button onClick={handleCopy}>Copy CSV</Button>
                <Button onClick={handleDownload}>Download CSV</Button>
            </Flex>
            <Code whiteSpace="pre-wrap" p={4}>
                {csvContent}
            </Code>
        </Box>
    );
};

export default WalletRecipientsCSV;
