import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useToast, Input, Button, Text } from "@chakra-ui/react";
import axios from "axios";
import { Formik, Form, Field } from "formik";

interface UserInfo {
    country: string;
    language: string;
    userName: string;
}

interface UpdateUserDetailsFormProps {
    accessToken: string;
}

export default function UpdateUserDetailsForm({
    accessToken,
}: UpdateUserDetailsFormProps) {
    const toast = useToast();

    const { isLoggedIn } = useWildfileUserContext();

    const saveUserDetails = async (values: UserInfo) => {
        try {
            await axios.put(`/api/beamable/fetch-account`, values, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            toast({
                title: "Success",
                description: "User details updated successfully",
                status: "success",
                duration: 9000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update user details",
                status: "error",
                duration: 9000,
                isClosable: true,
            });
        }
    };

    if (!isLoggedIn) {
        return <Text>Please log in to update your details</Text>;
    }

    return (
        <Formik
            initialValues={{
                country: "",
                language: "",
                userName: "",
            }}
            onSubmit={saveUserDetails}
        >
            <Form>
                <Field name="country" placeholder="Country" as={Input} mb={4} />
                <Field
                    name="language"
                    placeholder="Language"
                    as={Input}
                    mb={4}
                />
                <Field
                    name="userName"
                    placeholder="Username"
                    as={Input}
                    mb={4}
                />
                <Button type="submit" colorScheme="blue">
                    Save
                </Button>
            </Form>
        </Formik>
    );
}
