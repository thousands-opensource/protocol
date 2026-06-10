import React, { useState } from "react";
import {
    Box,
    Button,
    Flex,
    Text,
    useToast,
    Icon
} from "@chakra-ui/react";
import { FaPlay, FaStop } from "react-icons/fa";
import waxios from "@/utils/waxios";

interface RallyControlsProps {
    vendorEventId: string;
}

const RallyControls = ({ vendorEventId }: RallyControlsProps) => {
    const [isStarting, setIsStarting] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const toast = useToast();

    const handleRallyAction = async (action: "start" | "stop") => {
        const setLoading = action === "start" ? setIsStarting : setIsStopping;

        try {
            setLoading(true);
            await waxios.post(`/api/rally/${action}`, { vendorEventId });

            toast({
                title: `Rally ${action === "start" ? "started" : "stopped"} successfully`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error: any) {
            toast({
                title: `Failed to ${action} rally`,
                description: error.message,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            p={5}
            shadow="md"
            width="100%"
            maxWidth="400px"
            mt={4}
        >
            <Flex direction="column" gap={4}>
                <Text fontSize="xl" fontWeight="bold" textAlign="center">
                    Rally Controls
                </Text>

                <Flex gap={3} justifyContent="center">
                    <Button
                        colorScheme="green"
                        onClick={() => handleRallyAction("start")}
                        isLoading={isStarting}
                        leftIcon={<Icon as={FaPlay} />}
                    >
                        Start Rally
                    </Button>
                    <Button
                        colorScheme="red"
                        onClick={() => handleRallyAction("stop")}
                        isLoading={isStopping}
                        leftIcon={<Icon as={FaStop} />}
                    >
                        Stop Rally
                    </Button>
                </Flex>
            </Flex>
        </Box>
    );
};

export default RallyControls;