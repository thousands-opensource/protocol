import {
    Box,
    Button,
    Flex,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
} from "@chakra-ui/react";
import { IExternalStream } from "@repo/interfaces";
import { CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface PlatformStreamProps {
    platform: string;
    externalStreams: IExternalStream[];
}
const PlatformStream = ({ platform, externalStreams }: PlatformStreamProps) => {
    const filteredExternalStream = useMemo(() => {
        return externalStreams.filter((stream) => {
            return stream.platformId.toLowerCase() === platform.toLowerCase();
        });
    }, [externalStreams, platform]);

    const getStreamUrl = (platformUserName: string) => {
        switch (platform.toLowerCase()) {
            case "twitch": {
                return `https://twitch.tv/${platformUserName}`;
            }

            case "kick": {
                return "";
            }

            case "tiktok": {
                return "";
            }

            case "discord": {
                return "";
            }

            default:
                return `https://twitch.tv/${platformUserName}`;
        }
    };

    const renderFilteredExternalStreams = () => {
        if (!filteredExternalStream || filteredExternalStream.length === 0) {
            return (
                <Text color="gray.500" textAlign={"center"}>
                    No active streams
                </Text>
            );
        }

        return (
            <Table size="sm" variant="simple">
                <Thead>
                    <Tr>
                        <Th>Stream</Th>
                        <Th>Start Date</Th>
                        <Th>End Date</Th>
                        <Th>Amount Earned</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {filteredExternalStream.map((externalStream, index) => (
                        <Tr key={index}>
                            <Td>
                                <Link
                                    href={getStreamUrl(
                                        externalStream.platformUserName
                                    )}
                                    target="_blank"
                                    style={{
                                        textDecoration: "underline",
                                        color: "lightskyblue",
                                    }}
                                >
                                    {externalStream.platformUserName}
                                </Link>
                            </Td>
                            <Td>
                                {new Date(
                                    externalStream.startDate
                                ).toLocaleDateString()}{" "}
                                {new Date(
                                    externalStream.startDate
                                ).toLocaleTimeString()}
                            </Td>
                            <Td>
                                {externalStream?.endDate
                                    ? `${new Date(
                                          externalStream?.endDate
                                      ).toLocaleDateString()} ${new Date(
                                          externalStream?.endDate
                                      ).toLocaleTimeString()}`
                                    : ""}
                            </Td>
                            <Td>{externalStream.amountEarned}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        );
    };

    return (
        <Flex flexDirection={"column"}>{renderFilteredExternalStreams()}</Flex>
    );
};

export default PlatformStream;
