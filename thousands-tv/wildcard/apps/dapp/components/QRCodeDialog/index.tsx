import {
    Modal,
    ModalContent,
    Text,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    Button,
} from "@chakra-ui/react";
import { QRCode } from "@farcaster/auth-kit";
import * as styles from "./styles";
import PhoneIcon from "./PhoneIcon";
import { gilroyMedium, gilroyRegular } from "@/utils/themeUtil";

interface QRCodeDialogProps {
    open: boolean;
    onClose: () => void;
    url: string;
}

const QRCodeDialog = ({ open, onClose, url }: QRCodeDialogProps) => {
    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            size={"sm"}
            motionPreset="slideInBottom"
            isCentered
        >
            <ModalContent sx={styles.modalContentSx}>
                <ModalHeader sx={styles.modalHeaderSx}>
                    {"Sign in with Farcaster"}
                </ModalHeader>
                <ModalCloseButton
                    size={"lg"}
                    onClick={onClose}
                    sx={styles.modalCloseButtonSx}
                />
                <ModalBody>
                    <Text
                        sx={styles.modalSubTextSx}
                        className={gilroyMedium.className}
                    >
                        {`Scan with your phone's camera to continue.`}
                    </Text>
                    <div style={styles.qrCodeWrapperSx}>
                        <QRCode
                            uri={url}
                            size={264}
                            logoSize={22}
                            logoMargin={12}
                        />
                    </div>
                    <div style={styles.phoneLinkWrapperSx}>
                        <Button
                            style={styles.phoneButtonSx}
                            onClick={() => {
                                window.location.href = url;
                            }}
                            variant={"link"}
                        >
                            <PhoneIcon />
                            <span
                                style={styles.phoneTextSx}
                                className={gilroyMedium.className}
                            >
                                {`I'm using my phone →`}
                            </span>
                        </Button>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};
export default QRCodeDialog;
