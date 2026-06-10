import { ChakraNextImageSimple } from "@/components/Image/ChakraNextImageSimple";
import { ChevronRightIcon } from "@chakra-ui/icons";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    Flex,
    Button,
    Box,
    Text,
} from "@chakra-ui/react";
import Locke_Modal from "@/public/images/WildfileAssets/Collections/modal/Locke_Modal.webp";
import NewFeatureTextSVG from "./NewFeatureTextSVG";
import * as styles from "./styles";

interface WildfileNewFeatureModalProps {
    handleChangeWildfileTab: (newProfileTab: number) => void;
    isOpen: boolean;
    onClose: () => void;
}

const NEW_FEATURE_DESCRIPTION =
    "The Showcase tab is a new addition to the Thousands account, dedicated to displaying the Swag that users have collected. Swag is organized into sets, which can be completed by collecting each individual piece in a set.";

const WildfileNewFeatureModal = ({
    isOpen,
    onClose,
    handleChangeWildfileTab,
}: WildfileNewFeatureModalProps) => {
    return (
        <Modal
            size={["xs", "sm", "sm", "5xl", "5xl"]}
            blockScrollOnMount={false}
            isCentered
            isOpen={isOpen}
            onClose={onClose}
            motionPreset="slideInRight"
            allowPinchZoom={true}
            closeOnEsc={false}
        >
            <ModalOverlay />
            <ModalContent sx={styles.modalContentSx}>
                <ModalBody sx={styles.modalBodySx}>
                    <Flex sx={styles.newFeatureFlexBackgroundSx}>
                        <Flex sx={styles.newFeatureFlexSx}>
                            <Box sx={styles.newFeatureLeftPanelSx}>
                                <Box>
                                    <NewFeatureTextSVG />
                                </Box>
                                <Box sx={styles.newFeatureTextWrapperSx}>
                                    <Text
                                        sx={styles.newFeatureDescriptionSx}
                                        variant={"gilroy-medium"}
                                    >
                                        {NEW_FEATURE_DESCRIPTION}
                                    </Text>
                                    <Button
                                        rightIcon={<ChevronRightIcon />}
                                        onClick={() => {
                                            handleChangeWildfileTab(1);
                                            onClose();
                                        }}
                                        sx={styles.exploreMoreSx}
                                    >
                                        Explore More!
                                    </Button>
                                </Box>
                            </Box>
                            <Box sx={styles.imgWrapperSx}>
                                <ChakraNextImageSimple
                                    src={Locke_Modal.src}
                                    alt="locke modal cover"
                                    width={"500"}
                                    height={"500"}
                                    sx={styles.lockeImgSx}
                                    priority
                                />
                            </Box>
                        </Flex>
                    </Flex>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};
export default WildfileNewFeatureModal;
