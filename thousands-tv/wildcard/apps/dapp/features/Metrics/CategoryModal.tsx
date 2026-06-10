import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    VStack,
    HStack,
    Checkbox,
    Text,
    Flex,
    Divider,
} from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";
import {
    CATEGORIES,
    categoryConfigMap,
    MAX_NUM_CATEGORY_CHARTS,
} from "./types";
import React from "react";
import { CheckIcon } from "@chakra-ui/icons";

interface CategoryModalProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    selectedCategories: string[];
    setSelectedCategories: Dispatch<SetStateAction<string[]>>;
}
const CategoryModal = ({
    isOpen,
    setIsOpen,
    selectedCategories,
    setSelectedCategories,
}: CategoryModalProps) => {
    const toggleCategory = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(
                selectedCategories.filter((c) => c !== category)
            );
        } else {
            if (selectedCategories.length < MAX_NUM_CATEGORY_CHARTS) {
                setSelectedCategories([...selectedCategories, category]);
            }
        }
    };
    return (
        <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            isCentered
            size={{ base: "xs", md: "sm" }}
        >
            <ModalOverlay />
            <ModalContent
                background="transparent"
                borderRadius={0}
                boxShadow={"none"}
                gap={3}
            >
                <Flex justifyContent={"space-between"} alignItems={"center"}>
                    <ModalHeader p={0}>Charts</ModalHeader>
                    <ModalCloseButton position="initial" />
                </Flex>
                <ModalBody p={0}>
                    <VStack
                        p={4}
                        px={6}
                        align="start"
                        spacing={3}
                        backdropFilter="blur(15px)"
                        borderRadius="8px"
                        color="white"
                        overflow="hidden"
                        boxShadow="0 0 0 1px rgba(255, 255, 255, 0.3), 0 8px 32px rgba(0, 0, 0, 0.3)"
                        background="rgba(255, 255, 255, 0.25)" /* semi-transparent white */
                        border="1px solid rgba(255, 255, 255, 0.2)" /* subtle semi-transparent border */
                    >
                        {CATEGORIES.map((categoryKey, idx) => {
                            const category = categoryConfigMap[categoryKey];
                            const isLast = idx === CATEGORIES.length - 1;
                            const hasCategory =
                                selectedCategories.includes(categoryKey);
                            return (
                                <React.Fragment key={categoryKey}>
                                    <HStack
                                        key={categoryKey}
                                        justify="space-between"
                                        w="100%"
                                        onClick={() =>
                                            toggleCategory(categoryKey)
                                        }
                                        _hover={{
                                            cursor:
                                                selectedCategories.length >=
                                                    MAX_NUM_CATEGORY_CHARTS &&
                                                !hasCategory
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}
                                    >
                                        <Text>{category?.label}</Text>
                                        {hasCategory && <CheckIcon />}
                                    </HStack>
                                    {!isLast && (
                                        <Divider
                                            borderColor="whiteAlpha.700"
                                            borderWidth="1px"
                                            opacity={0.25}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};
export default CategoryModal;
