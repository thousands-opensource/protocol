import { ForecastStatus } from "@/types";
import { ButtonGroup, Button } from "@chakra-ui/react";

interface ForecastStatusFilterProps {
    selectedStatus: ForecastStatus;
    onStatusChange: (status: ForecastStatus) => void;
}

export const ForecastStatusFilter = ({ selectedStatus, onStatusChange }: ForecastStatusFilterProps) => {
    return (
        <ButtonGroup size="sm" isAttached variant="outline">
            <Button
                sx={{
                    bg: selectedStatus === "active" ? "gray" : "transparent",
                    _hover: {
                        bg: selectedStatus === "active" ? "gray" : "var(--chakra-colors-whiteAlpha-200)",
                    },
                }}
                onClick={() => onStatusChange("active")}
            >
                Active
            </Button>
            <Button
                sx={{
                    bg: selectedStatus === "closed" ? "gray" : "transparent",
                    _hover: {
                        bg: selectedStatus === "closed" ? "gray" : "var(--chakra-colors-whiteAlpha-200)",
                    },
                }}
                onClick={() => onStatusChange("closed")}
            >
                Ended
            </Button>
            <Button
                sx={{
                    bg: selectedStatus === "called" ? "gray" : "transparent",
                    _hover: {
                        bg: selectedStatus === "called" ? "gray" : "var(--chakra-colors-whiteAlpha-200)",
                    },
                }}
                onClick={() => onStatusChange("called")}
            >
                Called
            </Button>
            <Button
                sx={{
                    bg: selectedStatus === "airdropped" ? "gray" : "transparent",
                    _hover: {
                        bg: selectedStatus === "airdropped" ? "gray" : "var(--chakra-colors-whiteAlpha-200)",
                    },
                }}
                onClick={() => onStatusChange("airdropped")}
            >
                Airdropped
            </Button>
        </ButtonGroup>
    );
};
