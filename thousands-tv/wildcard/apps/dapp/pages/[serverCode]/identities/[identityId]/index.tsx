import { Button, Card, FormControl, FormLabel, Input, Select, Stack, useToast, VStack, Flex, Icon } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from "next/router";
import FileUpload from "../../../../components/FileUpload";
import { uploadFileToS3 } from "../../../../utils/s3Utils";
import EventLayout from "../../../../layouts/EventLayout";
import { AuthorizedUserData } from "../../../../utils/backend/sessionServerUtil";
import { checkUserAuthorizedForPage } from "../../../../utils/profileUtil";
import { WILDFILE_ROUTES } from "../../../../constants/routes";
import { formatRouteConfigUrl } from "../../../../utils/routeUtil";
import axiosAuthClientInstance from "../../../../lib/axiosAuthClientInstance";
import { FaChevronLeft } from "react-icons/fa";
import { diContainer } from '@/inversify.config';
import IIdentityRepository from '@/repositories/interfaces/IIdentityRepository';


interface EditIdentityProps {
    serverCode: string;
    identity: {
        _id: string;
        identityName: string;
        identityType: string;
        identityRole: string;
        showAsTalent: boolean;
        identityPfpImageUrl: string;
        supportTokenContractAddress?: string;
        startDate: string;
    };
}

function EditIdentity({ serverCode, identity }: EditIdentityProps) {
    console.log("identity id: ", identity._id);

    const router = useRouter();
    const toast = useToast();
    const [startDate, setStartDate] = useState<Date>(new Date(identity.startDate));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        identityName: identity.identityName,
        identityRole: identity.identityRole,
        showAsTalent: identity.showAsTalent,
        identityPfpImageUrl: identity.identityPfpImageUrl,
        identityType: identity.identityType,
        supportTokenContractAddress: identity.supportTokenContractAddress || ""
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                _id: identity._id,
                ...formData,
                startDate: startDate.toISOString(),
                ...(formData.supportTokenContractAddress && {
                    supportTokenContractAddress: formData.supportTokenContractAddress
                })
            };

            // Upload image to S3 if a new file was selected
                        if (imageFile) {
                            const imageUrl = await uploadFileToS3(imageFile);
                            payload.identityPfpImageUrl = imageUrl;
                        }

            await axiosAuthClientInstance.post("/api/identities/updateIdentity", payload);

            toast({
                title: "Identity updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            // Redirect back to identities list
            const formattedIdentitiesRouteUrl = formatRouteConfigUrl(
                WILDFILE_ROUTES.SERVER.IDENTITY_DASHBOARD.BASE.url,
                { serverCode }
            );
            router.push(formattedIdentitiesRouteUrl);
        } catch (error) {
            console.error("Error updating identity:", error);
            toast({
                title: "Error updating identity",
                description: "Please try again",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const backToIdentitiesUrl = formatRouteConfigUrl(
        WILDFILE_ROUTES.SERVER.IDENTITY_DASHBOARD.BASE.url,
        { serverCode }
    );

    return (
        <EventLayout>
            <VStack spacing={8} width="100%" maxW="600px" mx="auto" pt="2rem">
                <Card p={8} width="100%" border="1px gray solid">
                    <Flex justify="flex-start" mb={4}>
                        <Button
                            size="sm"
                            variant="link"
                            leftIcon={<Icon as={FaChevronLeft} />}
                            onClick={() => router.push(backToIdentitiesUrl)}
                        >
                            Back to Identities
                        </Button>
                    </Flex>

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Identity Name</FormLabel>
                                <Input
                                    name="identityName"
                                    value={formData.identityName}
                                    onChange={handleInputChange}
                                    placeholder="Enter identity name"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Identity Type</FormLabel>
                                <Select
                                    name="identityType"
                                    value={formData.identityType}
                                    onChange={handleInputChange}
                                    placeholder="Select identity type"
                                >
                                    <option value="person">Person</option>
                                    <option value="organization">Organization</option>
                                </Select>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Identity Role</FormLabel>
                                <Input
                                    name="identityRole"
                                    value={formData.identityRole}
                                    onChange={handleInputChange}
                                    placeholder="Enter identity role"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Show as Talent?</FormLabel>
                                <Select
                                    name="showAsTalent"
                                    value={formData.showAsTalent.toString()}
                                    onChange={handleInputChange}
                                    placeholder="Select identity type"
                                >
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </Select>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Profile Image URL</FormLabel>
                                <Input
                                    name="identityPfpImageUrl"
                                    value={formData.identityPfpImageUrl}
                                    onChange={handleInputChange}
                                    placeholder="Enter profile image URL"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Profile Image</FormLabel>
                                <FileUpload
                                    value={imageFile}
                                    onChange={(file) => {
                                        setImageFile(file);
                                        setFormData(prev => ({
                                            ...prev,
                                            identityPfpImageUrl: file?.name || ""
                                        }));
                                    }}
                                    onUrlChange={(url) => 
                                        setFormData(prev => ({
                                            ...prev,
                                            identityPfpImageUrl: url
                                        }))
                                    }
                                    existingUrl={formData.identityPfpImageUrl}
                                />
                            </FormControl>
                            
                            {/*
                            <FormControl>
                                <FormLabel>Support Token Contract Address (Optional)</FormLabel>
                                <Input
                                    name="supportTokenContractAddress"
                                    value={formData.supportTokenContractAddress}
                                    onChange={handleInputChange}
                                    placeholder="Enter token contract address"
                                />
                            </FormControl>
                            */}
                            <FormControl isRequired>
                                <FormLabel>Start Date</FormLabel>
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date: Date | null) => date && setStartDate(date)}
                                    dateFormat="MMMM d, yyyy"
                                    className="chakra-input css-1kp110w"
                                />
                            </FormControl>

                            <Button
                                mt={4}
                                colorScheme="blue"
                                type="submit"
                                isLoading={isSubmitting}
                                width="100%"
                            >
                                Update Identity
                            </Button>
                        </Stack>
                    </form>
                </Card>
            </VStack>
        </EventLayout>
    );
}

export default EditIdentity;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const identityId = context.params?.identityId as string;
    const serverCode = context?.params?.serverCode as string;

    const userAuthorizedForPageResult = await checkUserAuthorizedForPage(context);

    if (!userAuthorizedForPageResult.success) {
        return userAuthorizedForPageResult.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    const authorizedUserData: AuthorizedUserData =
        userAuthorizedForPageResult.data as AuthorizedUserData;

    try {
        const identityRepository = diContainer.get<IIdentityRepository>('IIdentityRepository');
        const identity = await identityRepository.getIdentity(identityId);

        if (!identity) {
            return {
                redirect: {
                    destination: formatRouteConfigUrl(
                        WILDFILE_ROUTES.SERVER.IDENTITY_DASHBOARD.BASE.url,
                        { serverCode }
                    ),
                    permanent: false,
                },
            };
        }

        return {
            props: {
                serverCode,
                identity: JSON.parse(JSON.stringify(identity)),
            },
        };
    } catch (error) {
        console.error("Error fetching identity:", error);
        return {
            redirect: {
                destination: formatRouteConfigUrl(
                    WILDFILE_ROUTES.SERVER.IDENTITY_DASHBOARD.BASE.url,
                    { serverCode }
                ),
                permanent: false,
            },
        };
    }
};
