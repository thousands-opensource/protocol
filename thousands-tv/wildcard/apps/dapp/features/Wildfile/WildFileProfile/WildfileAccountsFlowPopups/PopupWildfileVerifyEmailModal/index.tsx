import { ChakraNextImageSimple } from "@/components/Image/ChakraNextImageSimple";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    Flex,
    Box,
    Card,
} from "@chakra-ui/react";
import Locke_Modal from "@/public/images/WildfileAssets/Collections/modal/Locke_Modal.webp";
import {
    imgWrapperSx,
    lockeImgSx,
    modalBodySx,
    newFeatureFlexSx,
    newFeatureLeftPanelSx,
} from "../styles";
import WildfileThemedTextSVG from "@/components/WildfileThemedTextSVG";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { THEME_COLOR_BG_PRIMARY } from "@/constants";
import WildfileVerifyEmailForm from "./WildfileVerifyEmailForm";
import { useEffect } from "react";
import { useRouter } from "next/router";

interface PopupWildfileVerifyEmailModalProps {
    isUserEmailVerified: boolean;
    redirectUrl?: string;
    onNext: () => void;
}

const PopupWildfileVerifyEmailModal: React.FC<
    PopupWildfileVerifyEmailModalProps
> = ({ isUserEmailVerified, redirectUrl, onNext }) => {
    const { userDB, connectedUserDBEmail } = useWildfileUserContext();
    const router = useRouter();

    // Move the user to the next step if the email is verified
    const handleMoveToNextStep = () => {
        if (isUserEmailVerified) {
            if (redirectUrl) {
                router.push(redirectUrl);
            } else {
                onNext();
            }
        }
    };

    useEffect(() => {
        handleMoveToNextStep();
    }, [isUserEmailVerified, redirectUrl, router, onNext]);

    if (!userDB || isUserEmailVerified) {
        return null;
    }

    return (
        <Modal
            size={["xs", "sm", "sm", "5xl", "5xl"]}
            blockScrollOnMount={false}
            isCentered
            isOpen={true}
            onClose={() => {}}
            motionPreset="slideInRight"
            allowPinchZoom={true}
            closeOnEsc={false}
        >
            <ModalOverlay bg={THEME_COLOR_BG_PRIMARY} />
            <ModalContent>
                <ModalBody
                    sx={modalBodySx}
                    bg="blackAlpha.900"
                    borderRadius="md"
                >
                    <Card bg="blackAlpha.600">
                        <Flex>
                            <Flex
                                sx={newFeatureFlexSx}
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Box sx={newFeatureLeftPanelSx}>
                                    <Box>
                                        <WildfileThemedTextSVG
                                            titleText="Verify your Email"
                                            fontSize={32}
                                        />
                                        <WildfileVerifyEmailForm
                                            redirectUrl={redirectUrl}
                                            onEmailVerified={() => {
                                                handleMoveToNextStep();
                                            }}
                                        />
                                    </Box>
                                </Box>
                                <Box sx={imgWrapperSx}>
                                    <ChakraNextImageSimple
                                        src={Locke_Modal.src}
                                        alt="locke modal cover"
                                        width="500"
                                        height="500"
                                        sx={lockeImgSx}
                                        priority
                                    />
                                </Box>
                            </Flex>
                        </Flex>
                    </Card>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default PopupWildfileVerifyEmailModal;
