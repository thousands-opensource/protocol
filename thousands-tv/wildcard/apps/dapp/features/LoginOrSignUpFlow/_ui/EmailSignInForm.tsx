import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage, FormikErrors } from "formik";
import * as Yup from "yup";
import {
    Button,
    FormControl,
    Input,
    Text,
    VStack,
    InputGroup,
    InputRightElement,
    Icon,
    Link,
} from "@chakra-ui/react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { THEME_COLOR_FONT_REQUIRED, THEME_COLOR_SECONDARY } from "@/constants";
import { THEME_COLOR_COLOR_PRIMARY } from "@/theme/constants";

interface EmailSignInFormProps {
    onSubmit: any;
    onResetPassword: () => void;
    onSwitchToSignUp: () => void;
}

const validationSchema = Yup.object().shape({
    username: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().required("Required"),
});

const EmailSignInForm: React.FC<EmailSignInFormProps> = ({
    onSubmit,
    onResetPassword,
    onSwitchToSignUp,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const handlePasswordVisibility = () => setShowPassword(!showPassword);

    return (
        <Formik
            initialValues={{ username: "", password: "" }}
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
                                name="username"
                                type="email"
                                placeholder="email"
                                color={THEME_COLOR_COLOR_PRIMARY}
                            />
                            <Text
                                color={THEME_COLOR_FONT_REQUIRED}
                                fontSize={"sm"}
                            >
                                <ErrorMessage
                                    name="username"
                                    component={Text}
                                />
                            </Text>
                        </FormControl>
                        <FormControl>
                            <InputGroup>
                                <Field
                                    as={Input}
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    color={THEME_COLOR_COLOR_PRIMARY}
                                />
                                <InputRightElement width="4.5rem">
                                    <Button
                                        h="1.75rem"
                                        size="sm"
                                        onClick={handlePasswordVisibility}
                                    >
                                        <Icon
                                            as={
                                                showPassword
                                                    ? AiOutlineEye
                                                    : AiOutlineEyeInvisible
                                            }
                                        />
                                    </Button>
                                </InputRightElement>
                            </InputGroup>
                            <Text
                                color={THEME_COLOR_FONT_REQUIRED}
                                fontSize={"sm"}
                            >
                                <ErrorMessage
                                    name="password"
                                    component={Text}
                                />
                            </Text>
                        </FormControl>
                        <Button
                            type="submit"
                            bg="glass.bg"
                            border="1px solid"
                            borderColor={THEME_COLOR_SECONDARY}
                            isLoading={isSubmitting}
                            width="full"
                            color="white"
                        >
                            Log In
                        </Button>
                        <Link
                            fontSize={"md"}
                            color={THEME_COLOR_SECONDARY}
                            onClick={onResetPassword}
                        >
                            Forgot Password?
                        </Link>
                        <Text
                            fontSize={"md"}
                            textAlign={"center"}
                            color="white"
                        >
                            {`Don't have an account?`}{" "}
                            <Link
                                color={THEME_COLOR_SECONDARY}
                                onClick={onSwitchToSignUp}
                            >
                                Sign Up
                            </Link>
                        </Text>
                    </VStack>
                </Form>
            )}
        </Formik>
    );
};

export default EmailSignInForm;
