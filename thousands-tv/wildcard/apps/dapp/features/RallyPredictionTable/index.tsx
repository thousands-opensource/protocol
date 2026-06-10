import {
    Link,
    Image,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useColorModeValue,
    Badge,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { IRallyPrediction } from "@repo/interfaces";
import axiosAuthClientInstance, {
    CustomAxiosRequestConfig,
} from "@/lib/axiosAuthClientInstance";

const RallyPredictionTable = () => {
    const [rallyPredictions, setRallyPredictions] = useState<
        IRallyPrediction[]
    >([]);
    const [loading, setLoading] = useState(true);

    const bgColor = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    useEffect(() => {
        const fetchRallyPredictions = async () => {
            try {
                setLoading(true);

                const response = await axiosAuthClientInstance.get(
                    "/api/rallyPredictions/getRallyPredictions?includeHidden=true",
                    { showLoading: true } as CustomAxiosRequestConfig
                );

                if (response.status === 200) {
                    setRallyPredictions(response.data?.data || []);
                } else {
                    console.error("Error fetching forecasts");
                }

                setLoading(false);
            } catch (error) {
                console.error("Error fetching forecasts:", error);
                setLoading(false);
            }
        };

        fetchRallyPredictions();
    }, []);

    const renderPredictionsTableJSX = () => {
        return rallyPredictions.map((prediction) => {
            const isVisible = prediction.isVisible !== false;
            const predictionId = prediction._id?.toString() || "";

            return (
                <Tr key={predictionId || prediction.cmsId}>
                    <Td>
                        <Link href={`${predictionId}`}>{prediction.title}</Link>
                    </Td>
                    <Td>
                        {prediction.airdropComplete !== undefined && prediction.airdropComplete ? (
                            <Badge colorScheme="green">Airdropped</Badge>
                        ) : prediction.resolvedChoice !== undefined ? (
                            <Badge colorScheme="red">Resolved</Badge>
                        ) : new Date(prediction.endDate) < new Date() ? (
                            <Badge colorScheme="gray">Ended</Badge>
                        ) : (
                            <Badge colorScheme="blue">Active</Badge>
                        )}
                    </Td>
                    <Td>
                        <Badge colorScheme={isVisible ? "green" : "red"}>
                            {isVisible ? "Visible" : "Hidden"}
                        </Badge>
                    </Td>
                    <Td>{new Date(prediction.endDate).toLocaleDateString()}</Td>
                    <Td>
                        {prediction.imageUrl ? (
                            <Image
                                src={prediction?.imageUrl}
                                alt={prediction.title}
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "8px",
                                }}
                            />
                        ) : (
                            "No Image"
                        )}
                    </Td>
                    <Td>
                        {new Date(prediction.startDate).toLocaleDateString()}
                    </Td>
                </Tr>
            );
        });
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Table variant="simple" bg={bgColor} borderColor={borderColor}>
            <Thead>
                <Tr>
                    <Th>Title</Th>
                    <Th>Status</Th>
                    <Th>Visibility</Th>
                    <Th>End Date</Th>
                    <Th>Image</Th>
                    <Th>Start Date</Th>
                </Tr>
            </Thead>
            <Tbody>{renderPredictionsTableJSX()}</Tbody>
        </Table>
    );
};

export default RallyPredictionTable;
