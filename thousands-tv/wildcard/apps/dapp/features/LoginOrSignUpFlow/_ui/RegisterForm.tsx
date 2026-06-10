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

interface RegisterFormProps {
    onSubmit: (values: { email: string }) => void;
    onBack: () => void;
}

const validationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Required"),
});

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, onBack }) => {
    return (
        <Formik
            initialValues={{ email: "" }}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
        >
            {({ isSubmitting }) => (
                <Form>
                    <VStack spacing={4}>
                        <FormControl>
                            <FormLabel>Email</FormLabel>
                            <Field as={Input} name="email" type="email" />
                            <ErrorMessage
                                name="email"
                                component={Text}
                                // color="red.500"
                            />
                        </FormControl>
                        <Text fontSize="sm">
                            After registration, a verification email will be
                            sent to your email address.
                        </Text>
                        <Button
                            type="submit"
                            colorScheme="blue"
                            isLoading={isSubmitting}
                        >
                            Create Account
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

export default RegisterForm;
