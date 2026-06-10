//@ts-nocheck
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    FormErrorMessage,
    useToast,
} from "@chakra-ui/react";
import { Formik, Field, Form } from "formik";
import * as Yup from "yup";

// Validation schema for the form
const ChangePasswordSchema = Yup.object().shape({
    newPassword: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .required("This field is required"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
        .required("This field is required"),
});

const ChangePasswordForm = () => {
    const toast = useToast();

    const initialValues = {
        newPassword: "",
        confirmPassword: "",
    };

    const handleSubmit = (values, actions) => {
        // Simulate password change process
        setTimeout(() => {
            toast({
                title: "Password Changed",
                description: "Your password has been updated successfully.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
            actions.setSubmitting(false);
            actions.resetForm();
        }, 1000);
    };

    return (
        <VStack align="stretch" p={4}>
            <Formik
                initialValues={initialValues}
                validationSchema={ChangePasswordSchema}
                onSubmit={handleSubmit}
            >
                {(props) => (
                    <Form>
                        <Field name="newPassword">
                            {({ field, form }) => (
                                <FormControl
                                    isInvalid={
                                        form.errors.newPassword &&
                                        form.touched.newPassword
                                    }
                                    mb={4}
                                >
                                    <FormLabel htmlFor="newPassword">
                                        New Password
                                    </FormLabel>
                                    <Input
                                        {...field}
                                        id="newPassword"
                                        placeholder="New Password"
                                        type="password"
                                    />
                                    <FormErrorMessage>
                                        {form.errors.newPassword}
                                    </FormErrorMessage>
                                </FormControl>
                            )}
                        </Field>
                        <Field name="confirmPassword">
                            {({ field, form }) => (
                                <FormControl
                                    isInvalid={
                                        form.errors.confirmPassword &&
                                        form.touched.confirmPassword
                                    }
                                    mb={6}
                                >
                                    <FormLabel htmlFor="confirmPassword">
                                        Confirm Password
                                    </FormLabel>
                                    <Input
                                        {...field}
                                        id="confirmPassword"
                                        placeholder="Confirm Password"
                                        type="password"
                                    />
                                    <FormErrorMessage>
                                        {form.errors.confirmPassword}
                                    </FormErrorMessage>
                                </FormControl>
                            )}
                        </Field>
                        <Button
                            mt={4}
                            w="fit-content"
                            colorScheme="blue"
                            isLoading={props.isSubmitting}
                            type="submit"
                        >
                            Save Changes
                        </Button>
                    </Form>
                )}
            </Formik>
        </VStack>
    );
};

export default ChangePasswordForm;
