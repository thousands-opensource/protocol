import React, { useState, useEffect } from "react";
import { Text, Flex, VStack } from "@chakra-ui/react";

interface CountDownTimerProps {
    eventTime: string; // UTC datetime string
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

const CountDownTimer: React.FC<CountDownTimerProps> = ({ eventTime }) => {
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const eventDate = new Date(eventTime);
            const now = new Date();
            const difference = eventDate.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft(null);
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft({ days, hours, minutes, seconds });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [eventTime]);

    if (!timeLeft) {
        return <Text>The event is starting soon</Text>;
    }

    const TimeBlock = ({ value, unit }: { value: number; unit: string }) => (
        <Flex align="baseline" textAlign="start">
            <Text fontSize="4xl" fontWeight="bold" color="white" mx="1">
                {value.toString().padStart(2, "0")}
            </Text>
            <Text color="gray.400" fontWeight="medium" ml="1" mr="3">
                {unit}
            </Text>
        </Flex>
    );

    return (
        <VStack alignItems="start" justifyContent={"start"} py={2} gap={0}>
            <Text color="gray.400" fontSize={"sm"}>
                Event starting in
            </Text>
            <Flex align="start" justifyContent={"start"}>
                <TimeBlock value={timeLeft.days} unit="d" />
                <TimeBlock value={timeLeft.hours} unit="h" />
                <TimeBlock value={timeLeft.minutes} unit="m" />
                <TimeBlock value={timeLeft.seconds} unit="s" />
            </Flex>
        </VStack>
    );
};

export default CountDownTimer;
