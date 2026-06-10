import { Formik, Field, Form, ErrorMessage, useFormikContext } from "formik";
import axios from "axios";
import {
    Box,
    Button,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Input,
    Link,
    Text,
} from "@chakra-ui/react";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { useState } from "react";
import * as Yup from "yup";
import { THEME_COLOR_FONT_REQUIRED, THEME_COLOR_SECONDARY } from "@/constants";
import { readOnlyStyle } from "@/theme/constants";
import FormikPasswordInput from "@/components/FormikPasswordInput";
import SignUpChecklist from "@/components/SignupChecklist";
import {
    MIN_PASSWORD_LENGTH,
    VERIFICAITON_CODE_LENGTH,
} from "@/constants/constants";

interface FormValues {
    email: string;
    code: string;
    newPassword: string;
}

interface NewUserVerificationFlowProps {
    emailReadOnly: string;
}

export default function NewUserVerificationFlow({
    emailReadOnly,
}: NewUserVerificationFlowProps) {
    const [passwordUpdateStatus, setPasswordUpdateStatus] = useState<{
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
                "/api/accounts/beamable/password-update",
                values
            );
            const successMsg = "Account Verified.";
            onMessage({
                title: "Success",
                description: successMsg,
                status: "success",
            });
            setPasswordUpdateStatus({
                message: successMsg,
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

    const validationSchema = Yup.object().shape({
        email: Yup.string().required("Required"),
        code: Yup.string()
            .length(VERIFICAITON_CODE_LENGTH, "Code must be 6 characters")
            .required("Required"),
        newPassword: Yup.string()
            .min(MIN_PASSWORD_LENGTH, "Password must be at least 9 characters")
            .required("Required"),
    });

    const FormikSignUpChecklist = () => {
        const { values } = useFormikContext<FormValues>();
        return (
            <SignUpChecklist code={values.code} password={values.newPassword} />
        );
    };

    return (
        <>
            <Formik
                initialValues={initialValues}
                onSubmit={handleSubmit}
                validationSchema={validationSchema}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Box
                            mb={"15px"}
                            w={["auto", "auto", "auto", "500px"]}
                            fontSize={"md"}
                        >
                            <FormikSignUpChecklist />
                        </Box>
                        <Divider mb={"20px"} />
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
                                        <Text
                                            color={THEME_COLOR_FONT_REQUIRED}
                                            fontSize={"md"}
                                        >
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
                                        <Text
                                            color={THEME_COLOR_FONT_REQUIRED}
                                            fontSize={"md"}
                                        >
                                            <ErrorMessage name="code" />
                                        </Text>
                                    </FormControl>

                                    <FormControl id="newPassword" mb={4}>
                                        <FormLabel>New Password:</FormLabel>
                                        <Field
                                            type="password"
                                            name="newPassword"
                                            placeholder="New Password"
                                            as={FormikPasswordInput}
                                        />
                                        <Text
                                            color={THEME_COLOR_FONT_REQUIRED}
                                            fontSize={"md"}
                                        >
                                            <ErrorMessage name="newPassword" />
                                        </Text>
                                    </FormControl>
                                </>
                            )}

                            {passwordUpdateStatus && (
                                <Text
                                    mb={4}
                                    w={["auto", "auto", "auto", "500px"]}
                                    // color={
                                    //     passwordUpdateStatus.status ===
                                    //     "success"
                                    //         ? "green"
                                    //         : "red"
                                    // }
                                >
                                    {passwordUpdateStatus.message}
                                </Text>
                            )}

                            {passwordUpdateStatus?.status === "success" ? (
                                <Link href="/login">
                                    <Button
                                        type="button"
                                        isLoading={isSubmitting}
                                        isDisabled={isSubmitting}
                                        bg="glass.bg"
                                        border="1px solid"
                                        borderColor={THEME_COLOR_SECONDARY}
                                        width="full"
                                    >
                                        Back to login
                                    </Button>
                                </Link>
                            ) : (
                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                    isDisabled={isSubmitting}
                                    color={"white"}
                                    bg="glass.bg"
                                    border="1px solid"
                                    borderColor={THEME_COLOR_SECONDARY}
                                    width="full"
                                >
                                    Update
                                </Button>
                            )}
                        </Flex>
                    </Form>
                )}
            </Formik>
        </>
    );
}
