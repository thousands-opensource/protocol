import React, { useState, useEffect } from "react";
import { Formik, Field, Form, FieldInputProps, FormikHelpers } from "formik";
import { Button, Input, Box, Text, Flex, Divider } from "@chakra-ui/react";
import { exploreMoreSx, newFeatureDescriptionSx } from "./styles";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import axios from "axios";
import NewUserVerificationFlow from "./NewUserVerifcationFlow";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { AccountProvider, IUser } from "@repo/interfaces";
import ModalCompleteButton from "../../_ui/ModalCompleteButton";
import { getAccountProviderByAccountId } from "@/utils/accountsUtil";
import * as Yup from "yup";
import { WildcardAccountsApiResponse } from "@/types";

const NEW_FEATURE_DESCRIPTION =
    "Verify your Thousands account by confirming your email address. We will send you a verification email with a code to complete the process.";

interface FormValues {
    email: string;
}

interface WildfileVerifyEmailFormProps {
    redirectUrl?: string;
    onEmailVerified: () => void;
}

/**
 * Wildfile Modal Complete Verification Form
 */
const WildfileVerifyEmailForm: React.FC<WildfileVerifyEmailFormProps> = ({
    redirectUrl,
    onEmailVerified,
}) => {
    const {
        userDB,
        connectedUserDBProviderId,
        connectedUserDBEmail,
        setUserDB,
    } = useWildfileUserContext();
    const { onMessage } = useInfoNotifications();

    const [showPasswordVerificationForm, setShowPasswordVerificationForm] =
        useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(
        !!userDB?.beamableProvider?.isVerified
    );
    const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
    const [isEmailEditable, setIsEmailEditable] = useState<boolean>(true);
    const [isVerifyingEmail, setIsVerifyingEmail] = useState<boolean>(false);

    useEffect(() => {
        if (userDB) {
            if (userDB.beamableProvider?.email) {
                setUserEmail(userDB.beamableProvider.email);
                setIsEmailEditable(false);
            } else {
                const userDBConnectedAccount: AccountProvider | null =
                    getAccountProviderByAccountId(
                        userDB,
                        connectedUserDBProviderId
                    );
                const email =
                    userDBConnectedAccount?.email || connectedUserDBEmail;

                if (email && email !== userEmail) {
                    setUserEmail(email);
                }
                setIsEmailEditable(!email);
            }
        }
    }, [userDB, connectedUserDBProviderId, connectedUserDBEmail]);

    if (!userDB) {
        return null;
    }

    const handleEmailVerified = () => {
        setIsEmailVerified(true);
        onEmailVerified();
    };

    const validationSchema = Yup.object().shape({
        email: Yup.string()
            .email("Invalid email")
            .required("Email is required"),
    });

    const linkBeamableAccount = async (
        email: string
    ): Promise<WildcardAccountsApiResponse> => {
        try {
            const response = await axios.post(
                "/api/accounts/beamable/link-beamable-account",
                {
                    connectedUserDBProviderId,
                    email: email,
                }
            );
            return response.data;
        } catch (error) {
            console.error("Error linking Beamable account:", error);
            throw error;
        }
    };

    /***
     * Handle Verify Email Account
     * This takes the email and creates an account with Beamable + sends a verification email via the API
     * on progressing to the code confirmation modal.
     */

    const handleVerifyAndLinkEmailAccount = async (email: string) => {
        try {
            setIsVerifyingEmail(true);
            setUserEmail(email);

            // Link Beamable account
            const linkResult = await linkBeamableAccount(email);

            if (!linkResult.success) {
                throw new Error(linkResult.message || "Failed to link account");
            }

            // Update userDB with the new Beamable provider info
            if (userDB) {
                const updatedUserDB: IUser = {
                    ...userDB,
                    beamableProvider: linkResult.data,
                };
                setUserDB(updatedUserDB);
            }

            // @dev - verify and link via native beamable password reset api
            const response = await axios.post(
                "/api/beamable/password-reset",
                {
                    email,
                },
                {
                    headers: {
                        accept: "application/json",
                        "content-type": "application/json",
                    },
                }
            );

            if (!response?.data) {
                throw new Error("Failed to send verification email");
            }

            onMessage({
                title: "Verification Email Sent",
                description:
                    "A verification email has been sent to your email address.",
                status: "success",
                duration: 9000,
                isClosable: true,
            });
            setShowPasswordVerificationForm(true);
            setIsEmailEditable(false);
        } catch (error: any) {
            console.error("Failed to process email verification:", error);
            onMessage({
                title: "Verification Failed",
                description:
                    error.message ||
                    "An error occurred during the verification process.",
                status: "error",
                duration: 9000,
                isClosable: true,
                id: "email-verification-failed",
            });
        } finally {
            setIsVerifyingEmail(false);
        }
    };

    // Formik submission wrapper
    const handleFormSubmit = async (
        values: FormValues,
        actions: FormikHelpers<FormValues>
    ) => {
        try {
            await handleVerifyAndLinkEmailAccount(values.email);
        } finally {
            actions.setSubmitting(false);
        }
    };

    /**
     * Render Very Email Form JSX
     * @returns
     */
    const renderVeryEmailFormJSX = () => {
        return (
            <Formik
                initialValues={{ email: userEmail || "" }}
                validationSchema={validationSchema}
                enableReinitialize={true}
                onSubmit={handleFormSubmit}
            >
                {(props) => (
                    <Form>
                        <Flex flexDirection="column" gap="10px">
                            <Box>
                                <Field name="email">
                                    {({
                                        field,
                                        meta,
                                    }: {
                                        field: FieldInputProps<any>;
                                        meta: any;
                                    }) => (
                                        <Input
                                            {...field}
                                            id="email"
                                            type="email"
                                            readOnly={!isEmailEditable}
                                            placeholder="Enter your email"
                                        />
                                    )}
                                </Field>
                                {props.errors.email && props.touched.email && (
                                    <Text color="red">
                                        {props.errors.email}
                                    </Text>
                                )}
                            </Box>

                            <Box mb="10px" zIndex={1}>
                                <Text
                                    sx={newFeatureDescriptionSx}
                                    variant="gilroy-medium"
                                >
                                    {NEW_FEATURE_DESCRIPTION}
                                </Text>
                            </Box>

                            <Box mb="10px" zIndex={1}>
                                <Button
                                    isLoading={
                                        props.isSubmitting || isVerifyingEmail
                                    }
                                    isDisabled={
                                        props.isSubmitting ||
                                        isEmailVerified ||
                                        isVerifyingEmail
                                    }
                                    type="submit"
                                    sx={exploreMoreSx}
                                >
                                    {isEmailVerified
                                        ? "Email Verified"
                                        : "Verify Email"}
                                </Button>
                            </Box>
                            <Divider />
                            <Flex justifyContent="center">
                                {isEmailVerified && (
                                    <ModalCompleteButton
                                        buttonText="Done"
                                        redirectUrl={redirectUrl ?? "/"}
                                        isDisabled={!isEmailVerified}
                                    />
                                )}
                            </Flex>
                        </Flex>
                    </Form>
                )}
            </Formik>
        );
    };

    return (
        <>
            {/* Complete Verification Form */}
            {showPasswordVerificationForm ? (
                <NewUserVerificationFlow
                    emailReadOnly={userEmail || ""}
                    onEmailVerified={handleEmailVerified}
                    redirectUrl={redirectUrl ?? "/"}
                    setIsEmailVerified={setIsEmailVerified}
                    isEmailVerified={isEmailVerified}
                    handleVerifyAndLinkEmailAccount={() =>
                        handleVerifyAndLinkEmailAccount(userEmail || "")
                    }
                    isVerifyingEmail={isVerifyingEmail}
                />
            ) : (
                renderVeryEmailFormJSX()
            )}
        </>
    );
};

export default WildfileVerifyEmailForm;
