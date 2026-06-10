import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Switch,
    Text,
    VStack,
    HStack,
    useToast,
    Tag,
    Image,
    useDisclosure,
    Modal,
    Input,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Flex,
    Center,
} from "@chakra-ui/react";
import axios from "axios";
import {
    Formik,
    Field,
    Form,
    FieldInputProps,
    FormikHelpers,
    FormikValues,
} from "formik";
import { useRouter } from "next/navigation";
import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import { setTimeout } from "timers";
import Cookies from "js-cookie";
import {
    COOKIES_IS_OTP_SESSION_VALID,
    COOKIES_IS_OTP_SESSION_VALID_EXPIRY_SECONDS,
} from "@/utils/accountAPIUtil";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { AccountProviderType } from "@repo/interfaces";
import { THEME_COLOR_FONT_PRIMARY, THEME_COLOR_SECONDARY } from "@/constants";

const TwoFactorAuthenticationSettings = () => {
    const toast = useToast();

    const { userDB, setUserDB } = useWildfileUserContext();

    const initialValues: any = {
        authenticatorAppEnabled: false,
        emailEnabled: false,
        smsEnabled: false,
    };

    const handleSubmit = (actions: FormikHelpers<any>) => {
        setTimeout(() => {
            toast({
                title: "2FA Settings Updated",
                description:
                    "Your two-factor authentication settings have been updated.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
            actions.setSubmitting(false);
        }, 1000);
    };

    return (
        <Formik initialValues={initialValues} onSubmit={handleSubmit}>
            {({ values, isSubmitting, setFieldValue }) => (
                <Form>
                    <VStack align="stretch" p={4} spacing={4}>
                        <Text fontSize="lg" fontWeight="bold">
                            Multi-Factor Authentication (MFA)
                        </Text>
                        <Text>
                            Multi-factor authentication (MFA) can be used to
                            help protect your account from unauthorized access.
                        </Text>

                        <Box>
                            <Field
                                name="authenticatorAppEnabled"
                                type="checkbox"
                            >
                                {({
                                    field,
                                }: {
                                    field: FieldInputProps<any>;
                                }) => (
                                    <FormControl
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="space-between"
                                    >
                                        <FormLabel
                                            htmlFor="authenticatorAppEnabled"
                                            mb="0"
                                        >
                                            Multi-factor Authenticator App
                                        </FormLabel>
                                        <Switch
                                            {...field}
                                            id="authenticatorAppEnabled"
                                            size="lg"
                                        />
                                    </FormControl>
                                )}
                            </Field>
                            <Button size="sm" mt={2}>
                                Set Up
                            </Button>
                        </Box>

                        <Box>
                            <Field name="emailEnabled" type="checkbox">
                                {({
                                    field,
                                }: {
                                    field: FieldInputProps<any>;
                                }) => (
                                    <FormControl
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="space-between"
                                    >
                                        <HStack>
                                            <FormLabel
                                                htmlFor="emailEnabled"
                                                mb="0"
                                            >
                                                Email for Two-Factor
                                                Authentication
                                            </FormLabel>
                                            {(values as FormikValues)
                                                ?.emailEnabled && (
                                                <Tag
                                                    size="sm"
                                                    colorScheme="green"
                                                    borderRadius="full"
                                                >
                                                    Enabled
                                                </Tag>
                                            )}
                                        </HStack>
                                        <Switch
                                            {...field}
                                            id="emailEnabled"
                                            size="lg"
                                        />
                                    </FormControl>
                                )}
                            </Field>
                            <Button size="sm" mt={2}>
                                Primary
                            </Button>
                        </Box>

                        <Box>
                            <Field name="smsEnabled" type="checkbox">
                                {({
                                    field,
                                }: {
                                    field: FieldInputProps<any>;
                                }) => (
                                    <FormControl
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="space-between"
                                    >
                                        <FormLabel htmlFor="smsEnabled" mb="0">
                                            SMS Code for Two-Factor
                                            Authentication
                                        </FormLabel>
                                        <Switch
                                            {...field}
                                            id="smsEnabled"
                                            size="lg"
                                        />
                                    </FormControl>
                                )}
                            </Field>
                            <Button size="sm" mt={2}>
                                Set Up
                            </Button>
                        </Box>

                        <Button
                            mt={4}
                            colorScheme="blue"
                            isLoading={isSubmitting}
                            type="submit"
                            w="fit-content"
                        >
                            Save Changes
                        </Button>
                    </VStack>
                </Form>
            )}
        </Formik>
    );
};

export default TwoFactorAuthenticationSettings;

export const TwoFactorSetup = () => {
    const [qrCode, setQrCode] = useState(null);
    const {
        userDB,
        setUserDB,
        connectedUserDBEmail,
        connectedUserDBProviderId,
    } = useWildfileUserContext();

    if (!connectedUserDBEmail) {
        return null;
    }

    const handleSetup2FA = async () => {
        try {
            // Call your API to generate the secret and QR code
            const response = await axios.post("/api/auth/create-totp", {
                connectedUserDBProviderId: connectedUserDBProviderId,
            });

            const data = response.data;

            // Set the QR code data URL
            setQrCode(data.qr_code);
        } catch (error) {
            console.error("Error setting up 2FA:", error);
        }
    };

    return (
        <Flex
            flexDirection={"column"}
            gap="10px"
            justifyContent={"center"}
            align="stretch"
            p={"20px"}
        >
            <Text>
                Multi-factor authentication (MFA) can be used to help protect
                your account from unauthorized access.
            </Text>

            <Button
                color={THEME_COLOR_FONT_PRIMARY}
                border={`1px solid ${THEME_COLOR_SECONDARY}`}
                borderRadius={"2xl"}
                onClick={handleSetup2FA}
                variant="outline"
            >
                Set up MFA
            </Button>
            {qrCode && (
                <Center mt={4}>
                    <Image src={qrCode} alt="QR Code" w="200px" />
                </Center>
            )}
        </Flex>
    );
};

export const TwoFactorSetupDisconnect = () => {
    const {
        userDB,
        setUserDB,
        connectedUserDBEmail,
        connectedUserDBProviderId,
    } = useWildfileUserContext();
    const { onMessage } = useInfoNotifications();

    if (!connectedUserDBEmail) {
        return null;
    }

    const handleDisconnect2FA = async () => {
        try {
            // Remove TOTP and sets the enable_2fa flag to false
            const response = await axios.post("/api/auth/disconnect-totp", {
                connectedUserDBProviderId: connectedUserDBProviderId,
            });

            const data = response.data;
            console.log("2FA disconnect response:", data);

            if (!data.success) {
                onMessage({
                    title: "Error",
                    description: "Error disconnecting 2FA. Please try again.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }

            onMessage({
                title: "Success",
                description: "2FA disconnected successfully!",
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            // Refresh the page after 1 second
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error("Error disconnecting up 2FA:", error);
        }
    };

    return (
        <Flex flexDirection={"column"} gap="5px" justifyContent={"center"}>
            <Text>Disconnect Multi Factor Authentication for your account</Text>
            <Button
                bg="glass.bg"
                color="white"
                variant={"outline"}
                _hover={{ bg: "gray.500" }}
                onClick={handleDisconnect2FA}
            >
                Disconnect MFA
            </Button>
        </Flex>
    );
};

interface VerifyTOTPModalInterface {}

export const VerifyTOTPModal = ({}: VerifyTOTPModalInterface) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [totp, setTOTP] = useState(Array(6).fill(""));
    const [isLoadingVerifyingTOTP, setIsLoadingVerifyingTOTP] =
        useState<boolean>(false);
    const { onMessage } = useInfoNotifications();
    const {
        userDB,
        setUserDB,
        connectedUserDBEmail,
        connectedUserDBProviderId,
    } = useWildfileUserContext();

    if (userDB?.preferredProvider === AccountProviderType.WALLET) {
        <Text> Wallet Account not Supported for MFA</Text>;
    }

    if (!connectedUserDBEmail) {
        return null;
    }

    const handleSubmit = async () => {
        try {
            setIsLoadingVerifyingTOTP(true);

            const response = await axios.post("/api/auth/verify-totp", {
                connectedUserDBProviderId: connectedUserDBProviderId,
                token: totp.join(""),
            });

            if (response.data.status === "success") {
                // Handle success
                onMessage({
                    title: "Success",
                    description: "2FA successfully verified.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
                onClose();
                // Refresh the page after 1 second
                setTimeout(() => window.location.reload(), 1000);
            } else {
                // Handle error
                onMessage({
                    title: "Error",
                    description: "Invalid TOTP. Please try again.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                setTOTP(Array(6).fill("")); // Clear the input fields
            }
            setIsLoadingVerifyingTOTP(false);
        } catch (error) {
            setIsLoadingVerifyingTOTP(false);

            // Handle error
            onMessage({
                title: "Error",
                description: "An error occurred. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    // Assuming totp is an array of strings and setTOTP is a function that updates it
    const handleChange =
        (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
            // Only allow numbers to be entered
            if (!isNaN(Number(e.target.value))) {
                let newTOTP = [...totp];
                newTOTP[index] = e.target.value;
                setTOTP(newTOTP);

                // If a digit is entered, focus on the next input field
                if (e.target.value) {
                    if (index < totp.length - 1) {
                        const nextInput = document.getElementById(
                            `otp-input-${index + 1}`
                        );
                        nextInput?.focus();
                    }
                }
            }
        };

    // Assuming totp is an array of strings
    const handleKeyDown =
        (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
            // If backspace is pressed and the input field is empty, focus on the previous input field
            if (e.key === "Backspace" && !totp[index]) {
                if (index > 0) {
                    const previousInput = document.getElementById(
                        `otp-input-${index - 1}`
                    );
                    previousInput?.focus();
                }
            }
        };

    return (
        <>
            <Button
                w="fit-content"
                alignSelf={"center"}
                _hover={{ bg: "gray.500" }}
                border="1px solid white"
                onClick={onOpen}
                color="white"
            >
                Enter your MFA Code
            </Button>

            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent bg="blackAlpha.900" border={"1px solid white"}>
                    <ModalHeader color="white">Enter your MFA Code</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody color="white">
                        <Text fontSize={"xs"} mb={4}>
                            Please enter the TOTP (Time-Based One-Time Password)
                            displayed in your MFA (Multi-Factor Authentication)
                            app:
                        </Text>

                        <Flex justifyContent="space-between" gap="10px">
                            {totp.map((digit, index) => (
                                <Input
                                    id={`otp-input-${index}`}
                                    key={index}
                                    value={digit}
                                    onChange={handleChange(index)}
                                    onKeyDown={handleKeyDown(index)}
                                    maxLength={1}
                                    textAlign="center"
                                    m={1}
                                />
                            ))}
                        </Flex>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            isLoading={isLoadingVerifyingTOTP}
                            isDisabled={isLoadingVerifyingTOTP}
                            onClick={handleSubmit}
                            variant={"outline"}
                            color={THEME_COLOR_FONT_PRIMARY}
                            border={`1px solid ${THEME_COLOR_SECONDARY}`}
                            borderRadius={"2xl"}
                        >
                            Verify
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

interface VerifyTOTPModalOnSignInInterface {
    emailViaNextAuthBool?: boolean;
}

export const VerifyTOTPModalOnSignIn = ({
    emailViaNextAuthBool,
}: VerifyTOTPModalOnSignInInterface) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [totp, setTOTP] = useState(Array(6).fill(""));
    const router = useRouter();
    const [isLoadingVerifyingTOTP, setIsLoadingVerifyingTOTP] =
        useState<boolean>(false);

    const { userDB, setUserDB, connectedUserDBEmail } =
        useWildfileUserContext();

    const { onMessage } = useInfoNotifications();

    useEffect(() => {
        if (emailViaNextAuthBool) {
            onOpen();
        }
    }, [userDB?.authenticator?.isEnabled]);

    if (userDB?.preferredProvider === AccountProviderType.WALLET) {
        <Text> Wallet Account not Supported for MFA</Text>;
    }

    if (!connectedUserDBEmail && !emailViaNextAuthBool) {
        return null;
    }

    const handleSubmit = async () => {
        try {
            setIsLoadingVerifyingTOTP(true);
            const response = await axios.post("/api/auth/validate-totp", {
                email: connectedUserDBEmail,
                token: totp.join(""),
            });

            const isVerified = response.data.success;

            if (isVerified) {
                // Handle success
                onMessage({
                    title: "Success",
                    description: "Successfully signed in with 2FA.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });

                // Make an axios call to update the mfaStepCompleted and mfaStepCompletedAt fields
                await axios.post("/api/auth/update-mfa-step-completed", {
                    email: connectedUserDBEmail,
                    mfaStepCompleted: true,
                });

                // store some cookie
                let date = new Date();
                date.setTime(
                    date.getTime() +
                        COOKIES_IS_OTP_SESSION_VALID_EXPIRY_SECONDS * 1000
                );
                Cookies.set(COOKIES_IS_OTP_SESSION_VALID, "true", {
                    expires: date,
                });

                router.push("/wildfile"); // Redirect to NextAuth.js to finalize authentication
            } else {
                // Handle error
                onMessage({
                    title: "Error",
                    description: "Invalid TOTP. Please try again.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                setTOTP(Array(6).fill("")); // Clear the input fields
            }
            setIsLoadingVerifyingTOTP(false);
        } catch (error: any) {
            // Handle error
            setIsLoadingVerifyingTOTP(false);
            console.log("error", error);
            onMessage({
                title: "Error",
                description:
                    error?.response.data.message ||
                    "An error occurred. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    // Assuming totp is an array of strings and setTOTP is a function that updates it
    const handleChange =
        (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
            // Only allow numbers to be entered
            if (!isNaN(Number(e.target.value))) {
                let newTOTP = [...totp];
                newTOTP[index] = e.target.value;
                setTOTP(newTOTP);

                // If a digit is entered, focus on the next input field
                if (e.target.value) {
                    if (index < totp.length - 1) {
                        const nextInput = document.getElementById(
                            `otp-input-${index + 1}`
                        );
                        nextInput?.focus();
                    }
                }
            }
        };

    // Assuming totp is an array of strings
    const handleKeyDown =
        (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
            // If backspace is pressed and the input field is empty, focus on the previous input field
            if (e.key === "Backspace" && !totp[index]) {
                if (index > 0) {
                    const previousInput = document.getElementById(
                        `otp-input-${index - 1}`
                    );
                    previousInput?.focus();
                }
            }
        };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                isCentered
                closeOnOverlayClick={false}
                closeOnEsc={false}
            >
                <ModalOverlay bg={"blackAlpha.800"} />
                <ModalContent bg="blackAlpha.500" border="white solid 1px">
                    <ModalHeader color="white">Verify your Code</ModalHeader>
                    <ModalBody>
                        <Text fontSize={"xs"} mb={4} color="white">
                            Please enter the TOTP (Time-Based One-Time Password)
                            displayed in your MFA (Multi-Factor Authentication)
                            app:
                        </Text>

                        <Flex justifyContent="space-between" gap="10px">
                            {totp.map((digit, index) => (
                                <Input
                                    color="white"
                                    id={`otp-input-${index}`}
                                    key={index}
                                    value={digit}
                                    onChange={handleChange(index)}
                                    onKeyDown={handleKeyDown(index)}
                                    maxLength={1}
                                    textAlign="center"
                                    m={1}
                                />
                            ))}
                        </Flex>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            isLoading={isLoadingVerifyingTOTP}
                            isDisabled={isLoadingVerifyingTOTP}
                            onClick={handleSubmit}
                            variant={"outline"}
                            color={THEME_COLOR_FONT_PRIMARY}
                            border={`1px solid ${THEME_COLOR_SECONDARY}`}
                            borderRadius={"2xl"}
                        >
                            Verify
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};
