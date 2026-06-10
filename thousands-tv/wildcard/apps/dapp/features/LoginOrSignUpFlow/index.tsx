import * as Yup from "yup";
import { Flex } from "@chakra-ui/react";
import { getWebAppName } from "@/utils/environmentUtilWCA";

import ContinueWithFlow from "./_ui/ContinueWithFlow";
import { useState } from "react";

const WEB_APP_NAME = getWebAppName();

export const validationSchemaRegister = Yup.object({
    email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
});

export const validationSchemaLogin = Yup.object().shape({
    username: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .required("Required"),
});

interface LoginOrSignUpFlowProps {
    setIsSignUp: (isSignUp: boolean) => void;
    isSignUp: boolean;
}

interface LoginValues {
    username: string;
    password: string;
}

interface RegisterValues {
    email: string;
}

export default function LoginOrSignUpFlow({
    setIsSignUp,
    isSignUp,
}: LoginOrSignUpFlowProps) {
    return (
        <Flex justifyContent={"center"} alignItems={"center"} h="80vh">
            <ContinueWithFlow setIsSignUp={setIsSignUp} isSignUp={isSignUp} />
        </Flex>
    );
}
