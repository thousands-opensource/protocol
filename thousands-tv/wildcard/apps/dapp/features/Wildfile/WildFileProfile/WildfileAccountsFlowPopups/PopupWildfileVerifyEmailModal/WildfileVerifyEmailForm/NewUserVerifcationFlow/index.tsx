import { Formik, Field, Form, ErrorMessage } from "formik";
import axios from "axios";
import {
    Box,
    Button,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Portal,
    Text,
} from "@chakra-ui/react";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { EmailIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { exploreMoreSx, newFeatureDescriptionSx } from "../styles";
import { useRouter } from "next/router";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { readOnlyStyle } from "@/theme/constants";
import FormikPasswordInput from "@/components/FormikPasswordInput";

interface FormValues {
    email: string;
    code: string;
    newPassword: string;
}

interface NewUserVerificationFlowProps {
    emailReadOnly: string;
    onEmailVerified: () => void;
    redirectUrl?: string;
    setIsEmailVerified: (isEmailVerified: boolean) => void;
    isEmailVerified: boolean;
    handleVerifyAndLinkEmailAccount: () => Promise<void>;
    isVerifyingEmail: boolean;
}

export default function NewUserVerificationFlow({
    emailReadOnly,
    onEmailVerified,
    redirectUrl,
    setIsEmailVerified,
    isEmailVerified,
    handleVerifyAndLinkEmailAccount,
    isVerifyingEmail,
}: NewUserVerificationFlowProps) {
    const [passwordUpdateStatus, setPasswordUpdateStatus] = useState<{
        message: string;
        status: "success" | "error";
    } | null>(null);

    const router = useRouter();
    const [showOverlay, setShowOverlay] = useState(false);

    const { onMessage } = useInfoNotifications();
    const initialValues: FormValues = {
        email: emailReadOnly,
        code: "",
        newPassword: "",
    };
    const handleSubmit = async (values: FormValues) => {
        try {
            const response = await axios.post(
                "/api/accounts/beamable/password-update-and-verify-email",
                values,
                {
                    headers: {
                        accept: "application/json",
                        "content-type": "application/json",
                    },
                }
            );
            const successMsg = "Account successfully verified.";

            setPasswordUpdateStatus({
                message: successMsg,
                status: "success",
            });
            setIsEmailVerified(true);
            onEmailVerified();
            setShowOverlay(true);
        } catch (error: any) {
            console.error("Failed to confirm password update:", error);
            onMessage({
                title: "Error",
                description: error.response
                    ? error.response.data.message
                    : "An error occurred",
                status: "error",
            });
            setPasswordUpdateStatus({
                message:
                    "Failed to confirm password update: " +
                    (error.response
                        ? error.response.data.message
                        : "An error occurred"),
                status: "error",
            });
        }
    };

    // we redirect if it's a single page flow else we show the next button
    useEffect(() => {
        if (passwordUpdateStatus?.status === "success") {
            const timer = setTimeout(() => {
                if (redirectUrl) {
                    router.push(redirectUrl);
                } else {
                    router.push("/login");
                }
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [showOverlay, redirectUrl, router]);

    const validationSchema = Yup.object().shape({
        email: Yup.string().required("Required"),
        code: Yup.string().required("Required"),
        newPassword: Yup.string()
            .min(9, "Password must be at least 9 characters")
            .required("Required"),
    });

    /**
     * Renders the loading overlay if account is verified before moving to the next step or redirecting
     */
    const renderLoadingOverlayJSX = () => {
        if (showOverlay) {
            return (
                <Portal>
                    <LoadingOverlay message="Account Verified..." />
                </Portal>
            );
        }
    };

    return (
        <>
            {renderLoadingOverlayJSX()}
            <Heading as="h2" size="md" mb={4}>
                <Flex align="center">
                    <EmailIcon boxSize={6} mr={2} />
                    {isEmailVerified ? "Account Verified" : "Verify Account"}
                </Flex>
            </Heading>
            <Text
                mb={4}
                w={["auto", "auto", "auto", "500px"]}
                sx={newFeatureDescriptionSx}
                variant={"gilroy-medium"}
            >
                {isEmailVerified
                    ? `Your account has been verified.`
                    : `We have sent a verification code to your email. Please enter the code
				and your new password to complete the account verification process.\nThis may take a few minutes.`}
            </Text>
            {!isEmailVerified && (
                <Button
                    isLoading={isVerifyingEmail}
                    isDisabled={isVerifyingEmail}
                    onClick={handleVerifyAndLinkEmailAccount}
                    sx={exploreMoreSx}
                >
                    Resend Code
                </Button>
            )}
            <Divider mb={4} mt={4} />

            <Formik
                initialValues={initialValues}
                onSubmit={handleSubmit}
                validationSchema={validationSchema}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Flex
                            direction="column"
                            align={["center", "center", "center", "start"]}
                            justify="center"
                        >
                            {passwordUpdateStatus?.status !== "success" && (
                                <>
                                    <FormControl id="email" mb={4}>
                                        <FormLabel>Email:</FormLabel>
                                        <Field
                                            as={Input}
                                            name="email"
                                            placeholder="Email"
                                            isReadOnly
                                            style={readOnlyStyle}
                                        />
                                        <Text color="red">
                                            <ErrorMessage name="email" />
                                        </Text>
                                    </FormControl>

                                    <FormControl id="code" mb={4}>
                                        <FormLabel>Code:</FormLabel>
                                        <Field
                                            as={Input}
                                            name="code"
                                            placeholder="Code"
                                        />
                                        <Text color="red">
                                            <ErrorMessage name="code" />
                                        </Text>
                                    </FormControl>

                                    <FormControl id="newPassword" mb={4}>
                                        <FormLabel>New Password:</FormLabel>
                                        <Field
                                            as={FormikPasswordInput}
                                            type="password"
                                            name="newPassword"
                                            placeholder="New Password"
                                        />
                                        <Text color="red">
                                            <ErrorMessage name="newPassword" />
                                        </Text>
                                    </FormControl>
                                </>
                            )}

                            {passwordUpdateStatus && (
                                <Text
                                    mb={4}
                                    w={["auto", "auto", "auto", "500px"]}
                                    color={
                                        passwordUpdateStatus.status ===
                                        "success"
                                            ? "green"
                                            : "red"
                                    }
                                >
                                    {passwordUpdateStatus.message}
                                </Text>
                            )}

                            <Box my="10px">
                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                    isDisabled={isSubmitting || isEmailVerified}
                                    sx={exploreMoreSx}
                                >
                                    {isEmailVerified
                                        ? "Email Verified"
                                        : "Complete Verification"}
                                </Button>
                            </Box>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </>
    );
}
