import { Skeleton, Box, Flex, SystemStyleObject } from "@chakra-ui/react";
import PredictionCard from "./PredictionCard";
import PredictionDetail from "./PredictionDetail";
import { IRallyPrediction } from "@repo/interfaces";
import { Text } from "@chakra-ui/react";
import { ForecastStatus } from "@/types";

interface PredictionCardListProps {
    predictions: IRallyPrediction[];
    isLoadingPredictions: boolean;
    isCompletedView?: boolean;
    selectedStatus?: ForecastStatus;
    sx?: SystemStyleObject | undefined;
}
const PredictionCardList = ({
    predictions,
    isLoadingPredictions,
    isCompletedView = false,
    selectedStatus = "active",
    sx,
}: PredictionCardListProps) => {
    return isLoadingPredictions ? (
        <Flex
            gap={{ base: 6, md: 4 }}
            flexWrap="wrap"
            justify="center"
            px={{ base: 4, md: 0 }}
            py={{ base: 4, md: 6 }}
        >
            {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                    key={index}
                    height={{ base: "320px", md: "360px" }}
                    width={{ base: "100%", md: "300px" }}
                    borderRadius="16px"
                />
            ))}
        </Flex>
    ) : predictions.length > 0 ? (
        <Flex
            gap={{ base: 6, md: 8 }}
            flexWrap="wrap"
            justify="center"
            sx={sx}
            px={{ base: 4, md: 0 }}
            py={{ base: 4, md: 6 }}
        >
            {predictions.map((prediction) => (
                <Box
                    key={prediction?._id?.toString()}
                    width={{ base: "100%", md: "300px" }}
                >
                    <PredictionCard
                        prediction={prediction}
                        isCompleted={isCompletedView}
                    />
                </Box>
            ))}
        </Flex>
    ) : (
        <Box textAlign="center" py={10}>
            <Text color="gray.400" fontSize="lg">
                {`No ${selectedStatus} forecasts available`}
            </Text>
            <Text color="gray.500" fontSize="sm" mt={2}>
                {isCompletedView
                    ? "Completed forecasts will appear here"
                    : "Check back later for new forecasts"}
            </Text>
        </Box>
    );
};
export default PredictionCardList;
