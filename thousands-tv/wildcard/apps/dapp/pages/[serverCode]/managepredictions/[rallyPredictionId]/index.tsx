import { Button, Card, FormControl, FormLabel, Input, Stack, useToast, VStack, Flex, Icon, Select, Alert, AlertIcon, Switch, Box, Text } from "@chakra-ui/react";
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
import { formatRouteConfigUrl } from "../../../../utils/routeUtil";
import axiosAuthClientInstance from "../../../../lib/axiosAuthClientInstance";
import { FaChevronLeft } from "react-icons/fa";
import { diContainer } from '@/inversify.config';
import IRallyPredictionRepository from '@/repositories/interfaces/IRallyPredictionRepository';
import { WILDFILE_ROUTES } from "@/constants/routes";

interface EditRallyPredictionProps {
    serverCode: string;
    rallyPrediction: {
        _id: string;
        title: string;
        subTitle: string;
        optionAText: string;
        optionBText: string;
        optionAButtonColor: string;
        optionBButtonColor: string;
        startDate: string;
        endDate: string;
        maxCreditSpend: number;
        wcAmount: number;
        imageUrl?: string;
        resolvedChoice?: boolean;
        cmsId: string;
        isVisible?: boolean;
        airdropComplete?: boolean;
    };
}

function EditRallyPrediction({ serverCode, rallyPrediction }: EditRallyPredictionProps) {
    console.log("rally prediction id: ", rallyPrediction._id);

    const router = useRouter();
    const toast = useToast();
    const [startDate, setStartDate] = useState<Date>(new Date(rallyPrediction.startDate));
    const [endDate, setEndDate] = useState<Date>(new Date(rallyPrediction.endDate));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSettingResolvedChoice, setIsSettingResolvedChoice] = useState(false);
    const [selectedResolvedChoice, setSelectedResolvedChoice] = useState<string>("");

    const [formData, setFormData] = useState({
        title: rallyPrediction.title,
        subTitle: rallyPrediction.subTitle,
        optionAText: rallyPrediction.optionAText, 
        optionBText: rallyPrediction.optionBText, 
        optionAButtonColor: rallyPrediction.optionAButtonColor, 
        optionBButtonColor: rallyPrediction.optionBButtonColor,
        imageUrl: rallyPrediction.imageUrl || "",
        cmsId: rallyPrediction.cmsId,
        maxCreditSpend: rallyPrediction.maxCreditSpend,
        wcAmount: rallyPrediction.wcAmount,
        isVisible: rallyPrediction.isVisible !== false,
        airdropComplete: rallyPrediction.airdropComplete !== false,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSetResolvedChoice = async () => {
        if (!selectedResolvedChoice) {
            toast({
                title: "Please select a resolved choice",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsSettingResolvedChoice(true);

        try {
            const resolvedChoiceValue = selectedResolvedChoice === rallyPrediction.optionAText ? false : true;
            
            await axiosAuthClientInstance.post("/api/rallyPredictions/setResolvedChoice", {
                rallyPredictionId: rallyPrediction._id,
                resolvedChoice: resolvedChoiceValue
            });

            toast({
                title: "Resolved choice set successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            // Refresh the page to show the updated state
            router.reload();
        } catch (error: any) {
            console.error("Error setting resolved choice:", error);
            toast({
                title: "Error setting resolved choice",
                description: error.response?.data?.message || "Please try again",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSettingResolvedChoice(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                _id: rallyPrediction._id,
                ...formData,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                isVisible: formData.isVisible,
                airdropComplete: formData.airdropComplete,
            };

            // Upload image to S3 if a new file was selected
            if (imageFile) {
                const imageUrl = await uploadFileToS3(imageFile);
                payload.imageUrl = imageUrl;
            }

            console.log("payload: ", payload);

            await axiosAuthClientInstance.post("/api/rallyPredictions/updateRallyPrediction", payload);

            toast({
                title: "Rally prediction updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            // Redirect back to forecasts list
            const formattedRallyPredictionsRouteUrl = formatRouteConfigUrl(
                WILDFILE_ROUTES.SERVER.MANAGE_PREDICTIONS_DASHBOARD.BASE.url,
                { serverCode }
            );
            router.push(formattedRallyPredictionsRouteUrl);
        } catch (error) {
            console.error("Error updating forecast:", error);
            toast({
                title: "Error updating forecast",
                description: "Please try again",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const backToRallyPredictionsUrl = formatRouteConfigUrl(
        WILDFILE_ROUTES.SERVER.MANAGE_PREDICTIONS_DASHBOARD.BASE.url,
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
                            onClick={() => router.push(backToRallyPredictionsUrl)}
                        >
                            Back to forecasts
                        </Button>
                    </Flex>

                    {/* Resolved Choice Control */}
                    {rallyPrediction.resolvedChoice !== undefined && rallyPrediction.resolvedChoice !== null ? (
                        <Alert status="info" mb={4}>
                            <AlertIcon />
                            Resolved Choice: {rallyPrediction.resolvedChoice ? rallyPrediction.optionBText : rallyPrediction.optionAText}
                        </Alert>
                    ) : (
                        <Card p={4} mb={4}>
                            <Stack spacing={3}>
                                <FormLabel fontWeight="bold">Set Resolved Choice (One-time action)</FormLabel>
                                <Select
                                    placeholder="Select the winning option"
                                    value={selectedResolvedChoice}
                                    onChange={(e) => setSelectedResolvedChoice(e.target.value)}
                                >
                                    <option value={rallyPrediction.optionAText}>{rallyPrediction.optionAText}</option>
                                    <option value={rallyPrediction.optionBText}>{rallyPrediction.optionBText}</option>
                                </Select>
                                <Button
                                    colorScheme="red"
                                    size="sm"
                                    onClick={handleSetResolvedChoice}
                                    isLoading={isSettingResolvedChoice}
                                    isDisabled={!selectedResolvedChoice}
                                >
                                    Set Resolved Choice (Cannot be changed once set)
                                </Button>
                            </Stack>
                        </Card>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={4}>
                            <FormControl>
                                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                                    <Box>
                                        <FormLabel mb={0}>Visibility</FormLabel>
                                        <Text fontSize="sm" color="gray.500">
                                            {formData.isVisible ? "Forecast is visible to users" : "Forecast is hidden from users"}
                                        </Text>
                                    </Box>
                                    <Switch
                                        size="lg"
                                        isChecked={formData.isVisible}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            isVisible: e.target.checked
                                        }))}
                                        colorScheme={formData.isVisible ? "green" : "red"}
                                    />
                                </Flex>
                            </FormControl>

                            <FormControl>
                                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                                    <Box>
                                        <FormLabel mb={0}>Airdrop Status</FormLabel>
                                        <Text fontSize="sm" color="gray.500">
                                            {formData.airdropComplete ? "Airdrop complete" : "Airdrop incomplete"}
                                        </Text>
                                    </Box>
                                    <Switch
                                        size="lg"
                                        isChecked={formData.airdropComplete}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            airdropComplete: e.target.checked
                                        }))}
                                        colorScheme={formData.airdropComplete ? "green" : "red"}
                                    />
                                </Flex>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Title</FormLabel>
                                <Input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter rally prediction title"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Subtitle</FormLabel>
                                <Input
                                    name="subTitle"
                                    value={formData.subTitle}
                                    onChange={handleInputChange}
                                    placeholder="Enter rally prediction subtitle"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Option A Text</FormLabel>
                                <Input
                                    name="optionAText"
                                    value={formData.optionAText}
                                    onChange={handleInputChange}
                                    placeholder="Enter rally prediction option A text"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Option B Text</FormLabel>
                                <Input
                                    name="optionBText"
                                    value={formData.optionBText}
                                    onChange={handleInputChange}
                                    placeholder="Enter rally prediction option B text"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Option A Button Color</FormLabel>
                                <Input
                                    name="optionAButtonColor"
                                    value={formData.optionAButtonColor}
                                    onChange={handleInputChange}
                                    placeholder="Enter rally prediction option A button color"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Option B Button Color</FormLabel>
                                <Input
                                    name="optionBButtonColor"
                                    value={formData.optionBButtonColor}
                                    onChange={handleInputChange}
                                    placeholder="Enter rally prediction option B button color"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>CMS ID</FormLabel>
                                <Input
                                    name="cmsId"
                                    value={formData.cmsId}
                                    onChange={handleInputChange}
                                    placeholder="Enter CMS ID"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Maximum Credit Spend</FormLabel>
                                <Input
                                    name="maxCreditSpend"
                                    value={formData.maxCreditSpend}
                                    onChange={handleInputChange}
                                    placeholder="Enter number of credits"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>$WC Amount to Distribute</FormLabel>
                                <Input
                                    name="wcAmount"
                                    value={formData.wcAmount}
                                    onChange={handleInputChange}
                                    placeholder="Enter number of $WC tokens"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Image URL</FormLabel>
                                <Input
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleInputChange}
                                    placeholder="Enter image URL"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Image</FormLabel>
                                <FileUpload
                                    value={imageFile}
                                    onChange={(file) => {
                                        setImageFile(file);
                                        setFormData(prev => ({
                                            ...prev,
                                            imageUrl: file?.name || ""
                                        }));
                                    }}
                                    onUrlChange={(url) => 
                                        setFormData(prev => ({
                                            ...prev,
                                            imageUrl: url
                                        }))
                                    }
                                    existingUrl={formData.imageUrl}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Start Date</FormLabel>
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date: Date | null) => date && setStartDate(date)}
                                    dateFormat="MMMM d, yyyy"
                                    className="chakra-input css-1kp110w"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>End Date</FormLabel>
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date: Date | null) => date && setEndDate(date)}
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
                                Update Rally Prediction
                            </Button>
                        </Stack>
                    </form>
                </Card>
            </VStack>
        </EventLayout>
    );
}

export default EditRallyPrediction;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const rallyPredictionId = context.params?.rallyPredictionId as string;
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
        const rallyPredictionRepository = diContainer.get<IRallyPredictionRepository>('IRallyPredictionRepository');
        const rallyPrediction = await rallyPredictionRepository.getRallyPredictionById(rallyPredictionId);

        if (!rallyPrediction) {
            return {
                redirect: {
                    destination: formatRouteConfigUrl(
                        WILDFILE_ROUTES.SERVER.MANAGE_PREDICTIONS_DASHBOARD.BASE.url,
                        { serverCode }
                    ),
                    permanent: false,
                },
            };
        }

        return {
            props: {
                serverCode,
                rallyPrediction: JSON.parse(JSON.stringify(rallyPrediction)),
            },
        };
    } catch (error) {
        console.error("Error fetching rally prediction:", error);
        return {
            redirect: {
                destination: formatRouteConfigUrl(
                    WILDFILE_ROUTES.SERVER.MANAGE_PREDICTIONS_DASHBOARD.BASE.url,
                    { serverCode }
                ),
                permanent: false,
            },
        };
    }
};
