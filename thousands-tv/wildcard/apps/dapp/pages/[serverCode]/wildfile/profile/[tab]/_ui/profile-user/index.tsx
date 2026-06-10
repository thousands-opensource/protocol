import {
    Box,
    Button,
    Card,
    Divider,
    Flex,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Grid,
    GridItem,
    Input,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik } from "formik";
import * as Yup from "yup";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { getBeamableAccountByUserDB } from "@/utils/accountsUtil";
import axios from "axios";
import LinkedSocialToggle from "./_ui/share-linked-socials";
import PanelDescription from "../advanced-settings/_ui/panel-description";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { THEME_COLOR_FONT_PRIMARY, THEME_COLOR_SECONDARY } from "@/constants";

interface UserProfileFormValues {
    name: string;
    email: string;
}

const userProfileValidationSchema = Yup.object().shape({
    name: Yup.string()
        .required("Name is required")
        .min(2, "Name must be at least 2 characters"),
});

interface UserProfileFormValues {
    name: string;
    email: string;
    timezone: string;
    countryCode: string;
    displayName: string;
    image: string;
    beamableGamertagId: string;
}
interface UserProfileSettingsProps {}

const UserProfileSettings = ({}: UserProfileSettingsProps) => {
    const { onMessage } = useInfoNotifications();
    const { userDB, connectedUserDBEmail } = useWildfileUserContext();
    const beamableUser = getBeamableAccountByUserDB(userDB);

    if (!userDB) {
        return <Box>Loading...</Box>;
    }

    /**
     * Update the user's profile information
     */
    const handleSubmit = async (values: any, { setSubmitting }: any) => {
        try {
            if (!userDB || !userDB._id) {
                throw new Error("User ID not found in session.");
            }

            const response = await axios.patch(
                `/api/accounts/profile/general?_id=${userDB._id}`,
                values,
                {
                    headers: {
                        accept: "application/json",
                        "content-type": "application/json",
                    },
                }
            );

            const updatedUserDB = response.data;
            // update(updatedUserDB);
            // @audit - this should be handled with a refresh

            onMessage({
                title: "Profile Updated",
                description: "Your profile has been successfully updated.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error: any) {
            onMessage({
                title: "Update Failed",
                description:
                    error.response?.data?.message ||
                    "Failed to update your profile.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Render the Beamable Gamertag ID input field
     */
    const renderBeamableGamertagIdInput = () => {
        if (!beamableUser?.id) {
            return null;
        }

        return (
            <GridItem colSpan={2}>
                <Field name="beamableGamertagId">
                    {({
                        field,
                        meta,
                    }: FieldProps<string, UserProfileFormValues>) => (
                        <FormControl isDisabled>
                            {" "}
                            {/* Optional: Disable if not editable */}
                            <FormLabel htmlFor="beamableGamertagId">
                                Gamer Tag ID:
                            </FormLabel>
                            <Input
                                {...field}
                                id="beamableGamertagId"
                                placeholder="Gamer Tag ID"
                            />
                        </FormControl>
                    )}
                </Field>
            </GridItem>
        );
    };

    return (
        <Box overflow="hidden">
            <Formik
                initialValues={{
                    name: userDB?.preferences?.displayName ?? "",
                    email: connectedUserDBEmail ?? "",
                    beamableGamertagId: beamableUser?.id ?? "",
                }}
                onSubmit={handleSubmit}
                validationSchema={userProfileValidationSchema}
            >
                {(formikProps) => (
                    <Form>
                        <Flex flexDirection={"column"} gap="20px">
                            <PanelDescription
                                title="Basic Settings"
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
                                    <Grid
                                        templateColumns="repeat(2, 1fr)"
                                        gap={6}
                                    >
                                        <GridItem colSpan={2}>
                                            <Field name="name">
                                                {({
                                                    field,
                                                    meta,
                                                }: FieldProps<
                                                    string,
                                                    UserProfileFormValues
                                                >) => (
                                                    <FormControl
                                                        isInvalid={
                                                            meta.touched &&
                                                            !!meta.error
                                                        }
                                                    >
                                                        <FormLabel htmlFor="name">
                                                            Name
                                                        </FormLabel>
                                                        <Input
                                                            {...field}
                                                            id="name"
                                                            placeholder="Enter your name"
                                                        />
                                                        <FormErrorMessage>
                                                            {meta.error}
                                                        </FormErrorMessage>
                                                    </FormControl>
                                                )}
                                            </Field>
                                        </GridItem>
                                        {renderBeamableGamertagIdInput()}
                                        <GridItem colSpan={2}>
                                            <Field name="email">
                                                {({
                                                    field,
                                                    meta,
                                                }: FieldProps<
                                                    string,
                                                    UserProfileFormValues
                                                >) => (
                                                    <FormControl isDisabled>
                                                        {" "}
                                                        {/* Disabled email editing */}
                                                        <FormLabel htmlFor="email">
                                                            Email (Connected
                                                            Provider)
                                                        </FormLabel>
                                                        <Input
                                                            {...field}
                                                            id="email"
                                                            placeholder="Connect a Social Account Required"
                                                        />
                                                    </FormControl>
                                                )}
                                            </Field>
                                        </GridItem>
                                    </Grid>
                                </Card>
                            </PanelDescription>
                            <PanelDescription
                                title="Permissions"
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
                                    <LinkedSocialToggle />
                                </Card>
                            </PanelDescription>
                        </Flex>

                        <Flex justifyContent={"center"} mt="20px">
                            <Button
                                type="submit"
                                isLoading={formikProps?.isSubmitting}
                                variant={"outline"}
                                color={THEME_COLOR_FONT_PRIMARY}
                                border={`1px solid ${THEME_COLOR_SECONDARY}`}
                                borderRadius={"2xl"}
                            >
                                Confirm
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Box>
    );
};

export default UserProfileSettings;
