import React from "react";
import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    Input,
    GridItem,
    Flex,
} from "@chakra-ui/react";
import { Field, Form, Formik, FieldProps } from "formik";
import * as Yup from "yup";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import axios from "axios";
import { THEME_COLOR_DARK_GOLD } from "@/constants/constants";
import { useWildfileUserContext } from "../../../../../../contexts/globalContextAccounts";
import { DISPLAY_NAME_CHAR_LIMIT_MAX, DISPLAY_NAME_CHAR_LIMIT_MIN } from "@/constants";

export interface UserNameFormValues {
    name: string;
}

export const displayNameValidationSchema = Yup.object({
    name: Yup.string()
        .required("Name is required")
        .min(
            DISPLAY_NAME_CHAR_LIMIT_MIN,
            `Name must be at least ${DISPLAY_NAME_CHAR_LIMIT_MIN} characters`
        )
        .max(
            DISPLAY_NAME_CHAR_LIMIT_MAX,
            `Name must be under ${DISPLAY_NAME_CHAR_LIMIT_MAX} characters`
        ) // Adjust max length as needed
        .matches(
            /^[a-zA-Z0-9 _-]+$/,
            "Name can only contain letters, numbers, spaces, underscores, and dashes"
        ),
});

interface UserNameUpdateFormProps {
    initialName: string;
    userId: string;
    setIsDisplayNameSet: (isDisplayNameSet: boolean) => void;
    isDisplayNameSet: boolean;
    isButtonDisabled?: boolean;
}

const UpdateDisplayNameForm = ({
    initialName,
    userId,
    setIsDisplayNameSet,
    isDisplayNameSet,
    isButtonDisabled,
}: UserNameUpdateFormProps) => {
    const { onMessage } = useInfoNotifications();
    const { userDB } = useWildfileUserContext();
    console.log(isDisplayNameSet, "asdf");
    const handleSubmit = async (values: any, { setSubmitting }: any) => {
        try {
            const response = await axios.post(
                `/api/accounts/profile/setDisplayName`,
                {
                    displayName: values.name,
                },
                {
                    headers: {
                        accept: "application/json",
                        "content-type": "application/json",
                    },
                }
            );

            setIsDisplayNameSet(true);

            onMessage({
                title: "Profile Updated",
                description: "Your name has been successfully updated.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error: any) {
            onMessage({
                title: "Update Failed",
                description:
                    error.response?.data?.message ||
                    "Failed to update your name.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box>
            <Formik
                initialValues={{ name: initialName }}
                onSubmit={handleSubmit}
                validationSchema={displayNameValidationSchema}
            >
                {({ isSubmitting, values }) => (
                    <Form>
                        <Flex
                            flexDirection="row"
                            alignItems={"center"}
                            gap="10px"
                            p="5px"
                        >
                            <GridItem colSpan={2}>
                                <Field name="name">
                                    {({
                                        field,
                                        meta,
                                    }: FieldProps<
                                        string,
                                        UserNameFormValues
                                    >) => (
                                        <FormControl
                                            isInvalid={
                                                meta.touched && !!meta.error
                                            }
                                        >
                                            {/* <FormLabel htmlFor="name">
                                            Name
                                        </FormLabel> */}
                                            <Input
                                                {...field}
                                                id="name"
                                                placeholder="Enter your name"
                                                isReadOnly={isDisplayNameSet}
                                                color={
                                                    isDisplayNameSet
                                                        ? "gray.400"
                                                        : "white"
                                                }
                                            />
                                            <FormErrorMessage>
                                                {meta.error}
                                            </FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                            </GridItem>
                            <Button
                                isDisabled={
                                    !isButtonDisabled ||
                                    values.name.length <
                                    DISPLAY_NAME_CHAR_LIMIT_MIN ||
                                    values.name.length >
                                    DISPLAY_NAME_CHAR_LIMIT_MAX
                                }
                                type="submit"
                                isLoading={isSubmitting}
                                bg={THEME_COLOR_DARK_GOLD}
                                color="white"
                                _hover={{ bg: "blue.600" }}
                            >
                                {isDisplayNameSet ? "Selected" : "Choose Name"}
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Box>
    );
};

export default UpdateDisplayNameForm;
