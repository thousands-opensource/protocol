import { Box, Flex, Text } from "@chakra-ui/react";
import { Point } from "@repo/interfaces";
import * as styles from "./styles";

interface PointsProp {
    points: Point[];
}

const Points = ({ points }: PointsProp) => {
    /**
     * Render points structure with name and value of the points
     * @returns row of points, name and points
     */
    const renderPoints = () => {
        return points.map((pointOb) => {
            const { label, point } = pointOb;
            return (
                <Flex sx={styles.pointWrapper}>
                    <Text>{label}</Text>
                    <Text>{point}</Text>
                </Flex>
            );
        });
    };

    if (points.length === 0) {
        return <></>;
    }

    return <Flex sx={styles.pointContainer}>{renderPoints()}</Flex>;
};

export default Points;
