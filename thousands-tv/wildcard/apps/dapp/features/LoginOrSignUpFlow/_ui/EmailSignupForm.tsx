import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
    Button,
    FormControl,
    Input,
    Text,
    VStack,
    Link,
} from "@chakra-ui/react";
import { THEME_COLOR_FONT_REQUIRED, THEME_COLOR_SECONDARY } from "@/constants";

interface EmailSignUpFormProps {
    onSubmit: (values: { email: string }) => void;
    onSwitchToSignIn: () => void;
}

const validationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Required"),
});

const EmailSignUpForm: React.FC<EmailSignUpFormProps> = ({
    onSubmit,
    onSwitchToSignIn,
}) => {
    return (
        <Formik
            initialValues={{ email: "" }}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
        >
            {({ isSubmitting }) => (
                <Form>
                    <VStack
                        spacing={4}
                        w={["250px", "300px", "400px", "400px"]}
                    >
                        <FormControl>
                            <Field
                                as={Input}
                                name="email"
                                type="email"
                                placeholder="email"
                            />
                            <Text
                                color={THEME_COLOR_FONT_REQUIRED}
                                fontSize={"sm"}
                            >
                                <ErrorMessage name="email" component={Text} />
                            </Text>
                        </FormControl>
                        <Text fontSize="sm">
                            {`We'll send a verification email to this address.`}
                        </Text>
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            width="full"
                            bg="glass.bg"
                            border="1px solid"
                            borderColor={THEME_COLOR_SECONDARY}
                        >
                            Create Account
                        </Button>

                        <Text fontSize={"md"}>
                            Already have an account?{" "}
                            <Link
                                color={THEME_COLOR_SECONDARY}
                                onClick={onSwitchToSignIn}
                            >
                                Log In
                            </Link>
                        </Text>
                    </VStack>
                </Form>
            )}
        </Formik>
    );
};

export default EmailSignUpForm;
