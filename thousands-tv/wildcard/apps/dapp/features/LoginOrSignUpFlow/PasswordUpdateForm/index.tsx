import { Formik, Field, Form } from "formik";
import axios from "axios";
import {
    Button,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Text,
} from "@chakra-ui/react";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { EmailIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { readOnlyStyle } from "@/theme/constants";
import FormikPasswordInput from "@/components/FormikPasswordInput";

interface FormValues {
    email: string;
    code: string;
    newPassword: string;
}

export enum PasswordResetType {
    NEW_USER_VERIFICATION = "newUserVerification",
    PASSWORD_RESET = "passwordReset",
}

interface PasswordUpdateFormProps {
    emailReadOnly: string;
    passwordResetType: PasswordResetType;
}

/**
 * Form for updating a user's password
 */
export default function PasswordUpdateForm({
    emailReadOnly,
    passwordResetType,
}: PasswordUpdateFormProps) {
    const [passwordResetStatus, setPasswordResetStatus] = useState<{
        message: string;
        status: "success" | "error";
    } | null>(null);

    const { onMessage } = useInfoNotifications();
    const initialValues: FormValues = {
        email: emailReadOnly,
        code: "",
        newPassword: "",
    };
    const handleSubmit = async (values: FormValues) => {
        try {
            const response = await axios.post(
                "/api/beamable/password-update",
                values
            );
            onMessage({
                title: "Success",
                description:
                    "Thousands account created & successfully verified",
                status: "success",
            });
            setPasswordResetStatus({
                message: "Password update confirmed successfully. ",
                status: "success",
            });
        } catch (error: any) {
            console.error("Failed to confirm password update:", error.data);
            onMessage({
                title: "Error",
                description: error.response
                    ? error.response.data.message
                    : "An error occurred",
                status: "error",
            });
            setPasswordResetStatus({
                message:
                    "Failed to confirm password update: " +
                    (error.response
                        ? error.response.data.message
                        : "An error occurred"),
                status: "error",
            });
        }
    };

    return (
        <>
            <Heading as="h2" size="md" mb={4}>
                <Flex align="center">
                    <EmailIcon boxSize={6} mr={2} />
                    {passwordResetType ===
                    PasswordResetType.NEW_USER_VERIFICATION
                        ? "Verify Account"
                        : "Reset Password"}
                </Flex>
            </Heading>
            <Text mb={4} w={["auto", "auto", "auto", "500px"]}>
                {`We have sent a verification code to your email. Please enter the code
				and your new password to complete the ${
                    passwordResetType ===
                    PasswordResetType.NEW_USER_VERIFICATION
                        ? "account verification"
                        : "password reset"
                } process.`}
            </Text>
            <Divider mb={4} />

            <Formik initialValues={initialValues} onSubmit={handleSubmit}>
                {({ isSubmitting }) => (
                    <Form>
                        <Flex direction="column" align="start" justify="center">
                            <FormControl id="email" mb={4}>
                                <FormLabel>Email:</FormLabel>
                                <Field
                                    as={Input}
                                    name="email"
                                    placeholder="Email"
                                    isReadOnly
                                    style={readOnlyStyle}
                                />
                            </FormControl>

                            <FormControl id="code" mb={4}>
                                <FormLabel>Code:</FormLabel>
                                <Field
                                    as={Input}
                                    name="code"
                                    placeholder="Code"
                                />
                            </FormControl>

                            <FormControl id="newPassword" mb={4}>
                                <FormLabel>New Password:</FormLabel>
                                <Field
                                    as={FormikPasswordInput}
                                    type="password"
                                    name="newPassword"
                                    placeholder="New Password"
                                />
                            </FormControl>

                            {passwordResetStatus && (
                                <Text
                                    mb={4}
                                    w={["auto", "auto", "auto", "500px"]}
                                    color={
                                        passwordResetStatus.status === "success"
                                            ? "green"
                                            : "red"
                                    }
                                >
                                    {passwordResetStatus.message}
                                </Text>
                            )}

                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                                bg="blue.500"
                                _hover={{ bg: "blue.700" }}
                            >
                                {passwordResetType ===
                                PasswordResetType.NEW_USER_VERIFICATION
                                    ? "Verify Account"
                                    : "Reset Password"}
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </>
    );
}
