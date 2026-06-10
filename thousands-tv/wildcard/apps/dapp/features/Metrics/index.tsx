import { Box, Button, Flex, IconButton } from "@chakra-ui/react";
import { useState } from "react";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { WildcardApiResponse } from "@repo/interfaces";
import { HamburgerIcon } from "@chakra-ui/icons";
import CategoryModal from "./CategoryModal";
import CategoryCard from "./CategoryCard";
import { categoryConfigMap } from "./types";

const Metrics = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([
        "matchDuration",
    ]);

    return (
        <Box>
            <Flex flexDirection={"column"} align={"center"} gap={2}>
                <Flex
                    flexDirection={"column"}
                    justifyContent={"center"}
                    alignItems={"center"}
                    gap={4}
                    w={{ base: "340px", md: "785px" }}
                >
                    <Box alignSelf={"flex-start"}>
                        <IconButton
                            aria-label="Open menu"
                            icon={<HamburgerIcon />}
                            onClick={() => setIsOpen(true)}
                            variant="outline"
                        />
                    </Box>
                    {selectedCategories.map((categoryKey) => {
                        const category = categoryConfigMap[categoryKey];
                        if (!category) {
                            return null;
                        }

                        return (
                            <CategoryCard
                                key={categoryKey}
                                category={category}
                                categoryKey={categoryKey}
                            />
                        );
                    })}
                </Flex>
                <CategoryModal
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    selectedCategories={selectedCategories}
                    setSelectedCategories={setSelectedCategories}
                />
            </Flex>
        </Box>
    );
};
export default Metrics;
