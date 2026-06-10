import { Box, Flex, Select, Text } from "@chakra-ui/react";
import { useState } from "react";
import { poppinsLight, poppinsRegular } from "@/utils/themeUtil";
import { Category } from "./types";
import KeyIndicatorChartContainer from "./KeyIndicatorChartContainer";
import AverageDataLineChart from "./Chart/AverageDataLineChart";
import DataLineChart from "./Chart/DataLineChart";

interface CategoryCardProps {
    categoryKey: string;
    category: Category;
}
const CategoryCard = ({ categoryKey, category }: CategoryCardProps) => {
    const [days, setDays] = useState<number>(60);
    const { format, label } = category;

    const renderChart = () => {
        if (format === "long") {
            return (
                <DataLineChart
                    days={days}
                    category={category}
                    categoryKey={categoryKey}
                    selectedKeyIndicators={[]}
                />
            );
        } else {
            return (
                <KeyIndicatorChartContainer
                    days={days}
                    category={category}
                    categoryKey={categoryKey}
                />
            );
        }
    };

    return (
        <Flex
            flexDirection="row"
            justifyContent="center"
            w={{ base: "340px", md: "785px" }}
            height={{ base: "420px", md: "500px" }}
            bg="linear-gradient(to right, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.02) 70%, transparent 100%), rgba(255, 255, 255, 0.05)"
            backdropFilter="blur(15px)"
            borderRadius="16px"
            color="white"
            overflow="hidden"
            boxShadow="0 0 0 1px rgba(255, 255, 255, 0.3), 0 8px 32px rgba(0, 0, 0, 0.3)"
            py={4}
        >
            <Flex flexDirection="column" p={4} gap={4} w="685px" height="100%">
                <Text
                    fontSize="12px"
                    fontWeight="light"
                    letterSpacing="2px"
                    color="whiteAlpha.800"
                    textAlign="center"
                >
                    META ORACLE
                </Text>
                <Flex
                    flexDirection={{ base: "column", md: "row" }}
                    justifyContent={{ base: "center", md: "space-between" }}
                    alignItems="center"
                    w="100%"
                >
                    <Flex flexDirection="row" gap={2}>
                        <Text
                            fontSize={{ base: "14px", md: "18px" }}
                            fontWeight="bold"
                            letterSpacing="1px"
                            color="whiteAlpha.800"
                            textAlign="center"
                        >
                            {label}
                        </Text>
                    </Flex>
                    <Box>
                        <Select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            w="150px"
                            border="transparent"
                            className={poppinsRegular.className}
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={14}>Last 14 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={60}>Last 60 days</option>
                        </Select>
                    </Box>
                </Flex>
                <Flex
                    flexDirection="column"
                    height="100%"
                    width="100%"
                    flex="1"
                    minH={0}
                >
                    <Box flex="1" minH={0}>
                        {renderChart()}
                    </Box>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default CategoryCard;
