import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import {
    Switch,
    FormControl,
    FormLabel,
    Box,
    Button,
    FormErrorMessage,
    Flex,
    Card,
    Center,
} from "@chakra-ui/react";
import { Formik, Field, Form } from "formik";
import PanelDescription from "../advanced-settings/_ui/panel-description";
import axios from "axios";
import { getWebAppName } from "@/utils/environmentUtilWCA";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";

interface EmailPreferencesFormValues {}

const EmailPreferences = ({}: EmailPreferencesFormValues) => {
    const { onMessage } = useInfoNotifications();
    const {
        userDB,
        setUserDB,
        connectedUserDBEmail,
        connectedUserDBProviderId,
    } = useWildfileUserContext();

    if (!userDB) {
        return <Box>Loading...</Box>;
    }

    // @audit - should point to their preferred account provider
    if (!connectedUserDBEmail) {
        return (
            <Center>
                To manage your email preferences, please link an extra social
                account.
            </Center>
        );
    }

    const handleEmailPreferenceChange = async (values: any, actions: any) => {
        try {
            const response = await axios.patch(
                "/api/accounts/profile/email",
                {
                    userDBProviderId: connectedUserDBProviderId,
                    sendNotifications: values.sendNotifications,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const result = response.data;
            onMessage({
                title: result.message,
                description: "Your email preferences have been updated.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            actions.setSubmitting(false);
        } catch (error: any) {
            onMessage({
                title: "Update Failed",
                description:
                    error?.message ||
                    "An error occurred while updating email preferences.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            actions.setSubmitting(false);
        }
    };

    return (
        <Box p={4}>
            <Formik
                initialValues={{
                    sendNotifications: userDB?.preferences?.sendNotifications,
                }}
                onSubmit={handleEmailPreferenceChange}
            >
                {({ setFieldValue, isSubmitting }) => (
                    <Form>
                        <PanelDescription
                            title="Email Preferences"
                            description={<></>}
                        >
                            <Card
                                flex="1"
                                borderRadius={"lg"}
                                p={4}
                                bg="unset"
                                border="1px solid gray"
                                color="white"
                            >
                                <Box mb={4}>
                                    <Field name="sendNotifications">
                                        {({ field, form }: any) => (
                                            <FormControl
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="space-between"
                                                isInvalid={
                                                    form.errors
                                                        .sendNotifications &&
                                                    form.touched
                                                        .sendNotifications
                                                }
                                            >
                                                <FormLabel mb="0">
                                                    {`I would like to receive news, surveys, and special offers
											from ${getWebAppName()}`}
                                                    .
                                                </FormLabel>
                                                <Switch
                                                    isChecked={field.value}
                                                    onChange={(e) =>
                                                        setFieldValue(
                                                            field.name,
                                                            e.target.checked
                                                        )
                                                    }
                                                />
                                                <FormErrorMessage>
                                                    {
                                                        form.errors
                                                            .sendNotifications
                                                    }
                                                </FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>
                                </Box>
                                <Flex flexDirection="column">
                                    <Button
                                        mt={4}
                                        bg="glass.bg"
                                        _hover={{ bg: "glassDark.bg" }}
                                        isLoading={isSubmitting}
                                        type="submit"
                                        color="white"
                                        variant={"outline"}
                                    >
                                        Update Preferences
                                    </Button>
                                </Flex>
                            </Card>
                        </PanelDescription>
                    </Form>
                )}
            </Formik>
        </Box>
    );
};

export default EmailPreferences;
