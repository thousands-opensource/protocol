import React, { useState } from "react";
import { FieldInputProps, FormikProps } from "formik";
import {
    Input,
    InputGroup,
    InputRightElement,
    Button,
    useColorModeValue,
    InputProps,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";

interface FormikPasswordInputProps {
    field: FieldInputProps<string>;
    form: FormikProps<any>; // You can replace 'any' with your form values type if available
}

const FormikPasswordInput: React.FC<FormikPasswordInputProps> = ({
    field,
    form,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const iconColor = useColorModeValue("gray.400", "gray.300");

    return (
        <InputGroup size="md">
            <Input
                {...field}
                {...props}
                type={showPassword ? "text" : "password"}
            />
            <InputRightElement width="3rem">
                <Button onClick={togglePasswordVisibility} bg="transparent">
                    {showPassword ? (
                        <ViewIcon color={iconColor} />
                    ) : (
                        <ViewOffIcon color={iconColor} />
                    )}
                </Button>
            </InputRightElement>
        </InputGroup>
    );
};

export default FormikPasswordInput;
