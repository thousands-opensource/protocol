import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
    Button,
    FormControl,
    FormLabel,
    Input,
    Text,
    VStack,
} from "@chakra-ui/react";
import { THEME_COLOR_FONT_REQUIRED, THEME_COLOR_SECONDARY } from "@/constants";

interface PasswordResetFormProps {
    onSubmit: (email: string) => void;
    onBack: () => void;
}

const validationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Required"),
});

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
    onSubmit,
    onBack,
}) => {
    return (
        <Formik
            initialValues={{ email: "" }}
            validationSchema={validationSchema}
            onSubmit={(values) => onSubmit(values.email)}
        >
            {({ isSubmitting }) => (
                <Form>
                    <VStack spacing={4}>
                        <FormControl>
                            <FormLabel>Email</FormLabel>
                            <Field
                                as={Input}
                                name="email"
                                type="email"
                                fontSize={"md"}
                            />
                            <Text
                                color={THEME_COLOR_FONT_REQUIRED}
                                fontSize={"md"}
                            >
                                <ErrorMessage name="email" component={Text} />
                            </Text>
                        </FormControl>
                        <Text fontSize="sm">
                            {`Enter your email address and we'll send you a link
                            to reset your password.`}
                        </Text>
                        <Button
                            type="submit"
                            bg="glass.bg"
                            border="1px solid"
                            borderColor={THEME_COLOR_SECONDARY}
                            isLoading={isSubmitting}
                        >
                            Reset Password
                        </Button>
                        <Button variant="ghost" onClick={onBack}>
                            Back to Sign In
                        </Button>
                    </VStack>
                </Form>
            )}
        </Formik>
    );
};

export default PasswordResetForm;
