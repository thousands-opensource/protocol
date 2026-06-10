import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
    FormControl,
    FormLabel,
    Input,
    Select,
    Button,
    Box,
    Flex,
    IconButton,
    Text,
    Icon,
    Card,
    Divider,
    HStack,
    VStack,
    Link,
    Tooltip,
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    Checkbox,
    useToast,
    Spacer,
    Radio,
    RadioGroup,
    Stack,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Textarea,
    Code,
    InputGroup,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useDisclosure,
    Skeleton,
} from "@chakra-ui/react";
import {
    EditIcon,
    LinkIcon,
    LockIcon,
    CloseIcon,
    CheckIcon,
} from "@chakra-ui/icons";
import axios from "axios";
import { useParams } from "next/navigation";
import { FaChevronLeft, FaRegCalendarAlt } from "react-icons/fa";
import { GetServerSideProps } from "next";
//import TournamentBracketsTabs from "@/features/TournamentBracketsTabs";
import { IoLogoGameControllerB } from "react-icons/io";
import {
    AUTO_POLLING_INTERVAL_MS,
    EVENT_COPIED_MSG,
    THEME_COLOR_DARK_GOLDEN_YELLOW,
    toastDefaultOptions,
} from "@/constants/constants";
import {
    COOKIES_ACCESS_TOKEN_WILDCARD,
    createNotification,
    getWildcardAccessTokenFromCookiesServerSide,
} from "@/utils/accountAPIUtil";
import BeamableEventService from "@/services/implementations/beamable/beamableEventService";
import IStreamRepository from "@/repositories/interfaces/iStreamRepository";
import { diContainer } from "@/inversify.config";
import { IoIosPeople } from "react-icons/io";
import { getBeamableAccountByUserDB } from "@/utils/accountsUtil";
import { getUserDisplayName } from "@/utils/streamUtils";
import {
    AuthorizedUserData,
    authorizeUser,
} from "@/utils/backend/sessionServerUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import EventLayout from "@/layouts/EventLayout";
import connectToDb from "@/db/connectToDb";
import {
    IUser,
    WildcardApiResponse,
    IStage,
    AccessCodeType,
    AccessCodeIntent,
    UserRole,
    IBoostsSegment,
} from "@repo/interfaces";
import { NotificationData } from "@/types";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { formatRouteConfigUrl } from "@/utils/routeUtil";
import IEventService from "../../../../../services/interfaces/iEventService";
import IStageRepository from "../../../../../repositories/interfaces/iStageRepository";
import AwardTicketQueueVouchers from "@/features/Event/EventsSeries/AwardTicketQueueVouchers";
import AdminUserControl from "../../_ui/AdminUserControl";
import { EventStatus, GAME_MODE } from "@/features/Event/types";
import {
    BEAMABLE_RULE_NAMES,
    fetchEventDetails,
    getRuleValue,
} from "@/utils/eventUtil";
import { EventCreationPayload } from "@repo/interfaces";
import AccessCodeGenerationModal from "@/features/Event/EventsSeries/AccessCodesGenerationModal";
import CompetitorSignUpAccessCodeModal from "@/features/Event/EventsSeries/CompetitorSignUpAccessCodeModal";
import { useRouter } from "next/router";
import { CancelEventMatchModal } from "@/components/CancelEventMatchModal";
import { redirectIfNotLoggedIn } from "../../../../[...params]";
import { checkUserAuthorizedForPage } from "../../../../../utils/profileUtil";
import ShareEventLinkModal from "@/features/Event/ShareEventLink";
import { getAirDropGifts, getQueueApiUrl } from "@/utils/environmentUtilWCA";
import Cookies from "js-cookie";
import { FaTicketAlt } from "react-icons/fa";
import RenameUserModal from "../../_ui/RenameUserModal";
import {
    DistributionCompositeData,
    FanDetailObject,
} from "@/pages/api/pledgeAI/types";
import InsightsCopyField from "../../_ui/InsightsCopyField";
import TokenDistributionConfigModal from "../../_ui/TokenDistributionConfigModal";
import WalletRecipientsCSV from "../../_ui/WalletRecipientsCSV";
import MatchWinnerSelector from "../../_ui/MatchWinnerSelector";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { DownloadChatSpreadsheet } from "@/features/EventForm/DownloadChatSpreadsheet";
import {
    VOTE_TEAM_COLORS,
    VoteOption,
    VotingConfigSection,
} from "@/components/StreamApps/VotingStreamApp/VotingConfig";
import {
    SkyboxConfigSection,
    SkyboxTier,
} from "@/components/EventDashboard/SkyboxConfigSection";
import RallyControls from "../../_ui/RallyControls";
import { RallyHistoryResponse } from "@/pages/api/boosts/getBoostsSegments";
import GiftEvents from "../../_ui/GiftEvents";

// Define validation schema
const validationSchema = Yup.object({
    eventName: Yup.string().required("Required"),
    streamUrl: Yup.string().url("Invalid URL").required("Required"),
    eventStart: Yup.date().required("Required"),
    eventEnd: Yup.date().required("Required"),
    duration: Yup.number().required("Required"),
});

export interface EventData {
    id?: string;
    eventName: string;
    streamUrl: string;
    eventStart: Date;
    eventEnd: Date;
    duration: number;
}

interface EventModifyFormProps {
    event: EventData;
    onSubmit: (values: EventData) => void;
    onDelete: () => void;
}

export const EventModifyForm: React.FC<EventModifyFormProps> = ({
    event,
    onSubmit,
    onDelete,
}) => {
    return (
        <Formik
            initialValues={event}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
        >
            {({ setFieldValue, values }) => (
                <Form>
                    <FormControl>
                        <FormLabel>Event Name</FormLabel>
                        <Field name="eventName" as={Input} />
                        <ErrorMessage name="eventName" />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Stream URL</FormLabel>
                        <Field name="streamUrl" as={Input} />
                        <ErrorMessage name="streamUrl" />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Start Date</FormLabel>
                        <Input
                            type="date"
                            // value={values.eventStart}
                            onChange={(date) =>
                                setFieldValue("eventStart", date)
                            }
                        />
                        <ErrorMessage name="eventStart" />
                    </FormControl>

                    <FormControl>
                        <FormLabel>End Time</FormLabel>
                        <Input
                            type="time"
                            // value={values.eventEnd}
                            onChange={(date) => setFieldValue("eventEnd", date)}
                        />
                        <ErrorMessage name="eventEnd" />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Duration</FormLabel>
                        <Field name="duration" as={Select}>
                            <option value="30">30 min</option>
                            <option value="60">1 hour</option>
                            <option value="120">2 hours</option>
                            <option value="180">3 hours</option>
                            <option value="240">4 hours</option>
                        </Field>
                        <ErrorMessage name="duration" />
                    </FormControl>

                    <Box mt={4}>
                        <Button colorScheme="blue" type="submit">
                            Save
                        </Button>
                        <Button colorScheme="red" onClick={onDelete} ml={2}>
                            Delete
                        </Button>
                    </Box>
                </Form>
            )}
        </Formik>
    );
};

// =======

interface EventCreateFormProps {
    onSubmit: (values: EventData) => void;
}

export const EventCreateForm: React.FC<EventCreateFormProps> = ({
    onSubmit,
}) => {
    const initialValues: EventData = {
        eventName: "",
        streamUrl: "",
        eventStart: new Date("2024-04-01"),
        eventEnd: new Date("2042-04-01"),
        duration: 60,
    };

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
        >
            {({ setFieldValue }) => (
                <Form>
                    <FormControl>
                        <FormLabel>Event Name</FormLabel>
                        <Field name="eventName" as={Input} />
                        <ErrorMessage name="eventName" />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Stream URL</FormLabel>
                        <Field name="streamUrl" as={Input} />
                        <ErrorMessage name="streamUrl" />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Start Date</FormLabel>
                        <Input
                            type="date"
                            onChange={(date) =>
                                setFieldValue("eventStart", date)
                            }
                        />
                        <ErrorMessage name="eventStart" />
                    </FormControl>

                    <FormControl>
                        <FormLabel>End Time</FormLabel>
                        <Input
                            type="time"
                            onChange={(date) => setFieldValue("eventEnd", date)}
                        />
                        <ErrorMessage name="eventEnd" />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Duration</FormLabel>
                        <Field name="duration" as={Select}>
                            <option value="30">30 min</option>
                            <option value="60">1 hour</option>
                            <option value="120">2 hours</option>
                            <option value="180">3 hours</option>
                            <option value="240">4 hours</option>
                        </Field>
                        <ErrorMessage name="duration" />
                    </FormControl>

                    <Box mt={4}>
                        <Button colorScheme="blue" type="submit">
                            Create
                        </Button>
                    </Box>
                </Form>
            )}
        </Formik>
    );
};

interface EventCardProps {
    seriesId: string;
    eventId: string;
    vendorEventId: string;
    eventStatus: string;
    ingestEndpoint: string;
    streamKey: string;
    segment: number;
    onEdit: () => void;
    userRole: string;
}

declare global {
    var beamableEventService: BeamableEventService;
}

export const EventCard: React.FC<EventCardProps> = ({
    seriesId,
    eventId,
    vendorEventId,
    eventStatus,
    ingestEndpoint,
    streamKey,
    segment,
    onEdit,
    userRole,
}) => {
    const stageId = eventId; //eventId = stageId;

    const [event, setEvent] = useState<EventCreationPayload | null>(null);
    const [toolTipText, setToolTipText] = useState<string>("Copy");
    const [open, setOpen] = useState<boolean>(false);
    const [teamAssignments, setTeamAssignments] = useState<{
        team1: IUser[];
        team2: IUser[];
    }>({ team1: [], team2: [] });
    const [userToRename, setUserToRename] = useState<IUser | undefined>(
        undefined
    );
    const [isFetchingLeaderboard, setIsFetchingLeaderboard] = useState(false);
    const [leaderboard, setLeaderboard] = useState<IUser[]>([]);
    const [autoPolling, setAutoPolling] = useState<boolean>(false);
    const [currentEventStatus, setCurrentEventStatus] =
        useState<string>(eventStatus);
    const [eventToCancel, setEventToCancel] = useState<{
        vendorEventId: string;
        matchId: string;
    } | null>(null);

    // Generate Access Code Modal
    const [isGenerateModalOpen, setIsGenerateModalOpen] =
        useState<boolean>(false);

    // Share Competitor Link Modal
    const [isShareCompetitorLinkModalOpen, setIsShareCompetitorLinkModalOpen] =
        useState<boolean>(false);
    const [isShareEventLinkModalOpen, setIsShareEventLinkModalOpen] =
        useState<boolean>(false);

    const [refereeResults, setRefereeResults] =
        useState<DistributionCompositeData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const toast = useToast();
    const { onMessage } = useInfoNotifications();
    const airdropGiftsStr = getAirDropGifts();
    const airdropGifts = JSON.parse(airdropGiftsStr) as {
        Id: string;
        Name: string;
        ImageUrl: string;
        Description: string;
    }[];
    const [airdropId, setAirdropId] = useState<string>("");
    const [airdropQuantity, setAirdropQuantity] = useState<number>(1);

    const [generalAdmissionViewers, setGeneralAdmissionViewers] =
        useState<number>(0);
    const [numQueueToAdvance, setNumQueueToAdvance] = useState<number>(1);
    const [walletAddresses, setWalletAddresses] = useState<{
        Wallets: Pick<
            FanDetailObject,
            "AdditionalWalletAddresses" | "WalletAddress"
        >[];
    }>({ Wallets: [] });

    const [rallyHistory, setRallyHistory] = useState<IBoostsSegment[] | null>(
        null
    );

    const [skyboxTiers, setSkyboxTiers] = useState<SkyboxTier[]>([]);

    const handleChangeNumQueueToAdvance = (
        valueAsString: string,
        valueAsNumber: number
    ) => setNumQueueToAdvance(!valueAsString ? 1 : valueAsNumber);

    const handleChangeAirdropQuantity = (
        valueAsString: string,
        valueAsNumber: number
    ) => setAirdropQuantity(!valueAsString ? 1 : valueAsNumber);

    const getGameMode = (): GAME_MODE => {
        if (!event) {
            const msg = "Error getting game mode. Event is null!";
            console.error(msg);
            return GAME_MODE.NONE;
        }

        const gameMode = event.content?.gameMode
            ? (event.content?.gameMode as GAME_MODE)
            : GAME_MODE.NONE;

        return gameMode;
    };

    const checkSoloMatch = () => {
        const gameMode = getGameMode() as GAME_MODE;

        if (gameMode !== GAME_MODE["1V1"]) {
            return false;
        }

        return true;
    };

    const checkCreateMatchIsDisabled = () => {
        const isSoloMatch = checkSoloMatch();
        const requiredPerTeam = isSoloMatch ? 1 : 2;
        if (
            teamAssignments.team1.length === requiredPerTeam &&
            teamAssignments.team2.length === requiredPerTeam
        ) {
            return false;
        }
        return true;
    };

    const createMatch = async () => {
        if (!event) {
            const msg = "Error creating match. Event is null!";
            console.error(msg);
            return;
        }

        console.log("Event: ", event);

        const matches = getMatches(event);

        const nextMatchNumber = matches.length + 1;
        const matchDisplayText = `Match${nextMatchNumber}`;

        const competitorIds = [
            ...teamAssignments.team1,
            ...teamAssignments.team2,
        ].map((competitor) => {
            const beamableUser = getBeamableAccountByUserDB(competitor);
            return beamableUser?.id;
        });

        try {
            const response = axios.post("/api/events/addEventMatch", {
                vendorEventId,
                matchId: matchDisplayText,
                cameraOperator: getCameraOperatorGamerTag(event),
                competitorGameTags: competitorIds,
            });

            if (!response) {
                const msg = "Error creating match";
                toast({
                    description: msg,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }

            //Update the event state to trigger rerendering of the matches list
            const newRule = {
                matchId: matchDisplayText,
                matchState: "waitingForCameraOperator",
                competitors: competitorIds,
            };
            event.content.phases[0].rules.push({
                rule: matchDisplayText,
                value: JSON.stringify(newRule),
            });

            // Generate request body with user id
            const sendNotification = async (
                player: IUser,
                otherPlayers: IUser[]
            ) => {
                const opponentNames = otherPlayers
                    .map(getUserDisplayName)
                    .join(" and ");
                const body: NotificationData = {
                    recipientUserId: player._id!.toString(),
                    subject: "Match Found",
                    body:
                        otherPlayers.length === 1
                            ? `You are match with another competitor ${opponentNames}`
                            : `You are matched with competitors ${opponentNames}`,
                };
                return await createNotification(body);
            };

            // Send notifications to each player in both teams with their opponents.
            await Promise.all(
                teamAssignments.team1.map((player) =>
                    sendNotification(player, teamAssignments.team2)
                )
            );
            await Promise.all(
                teamAssignments.team2.map((player) =>
                    sendNotification(player, teamAssignments.team1)
                )
            );

            const msg =
                "Created a match and sent notification to competitors successfully";
            toast({
                description: msg,
                status: "success",
                duration: 5000,
                position: "top",
            });
        } catch (e: any) {
            const msg = `Error creating match and sending notification: ${e.message}`;
            console.error(msg);
            toast({
                description: msg,
                status: "error",
                duration: 5000,
                position: "top",
            });
        }
    };

    const fetchWalletAddresses = async (count?: number) => {
        try {
            const wildcardAccessToken = Cookies.get(
                COOKIES_ACCESS_TOKEN_WILDCARD
            );

            setWalletAddresses({ Wallets: [] });

            const getWalletAddressesApiUrl = getQueueApiUrl() + "/getwallets";
            const walletAddressesResponse = await axios.post(
                getWalletAddressesApiUrl,
                {
                    VendorEventId: vendorEventId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${wildcardAccessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (walletAddressesResponse.status == 200) {
                if (!count) setWalletAddresses(walletAddressesResponse.data);
                else {
                    const { Wallets } = walletAddressesResponse.data;
                    const randomWallets = Wallets.sort(
                        () => Math.random() - 0.5
                    ).slice(0, count);

                    setWalletAddresses({
                        Wallets: randomWallets,
                    });
                }
                return;
            }
        } catch (e: any) {
            const msg = `Error failed to fetch wallet addresses ${e}`;
            console.error(msg);
            toast({
                ...toastDefaultOptions,
                description: msg,
                status: "error",
                duration: 7000,
            });
            return;
        }
    };

    const fetchGeneralAdmissionViewers = async () => {
        try {
            const wildcardAccessToken = Cookies.get(
                COOKIES_ACCESS_TOKEN_WILDCARD
            );
            const generalAdmissionViewersApiUrl =
                getQueueApiUrl() + "/getgeneraladmissioncount";
            const generalAdmissionViewersRes = await axios.post(
                generalAdmissionViewersApiUrl,
                {
                    VendorEventId: vendorEventId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${wildcardAccessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (generalAdmissionViewersRes.status == 200) {
                console.log(
                    "CountOfGeneralAdmissionFans",
                    generalAdmissionViewersRes
                );
                setGeneralAdmissionViewers(
                    generalAdmissionViewersRes.data.CountOfGeneralAdmissionFans
                );
                return;
            }

            /*
            toast({
                description: `general admission placeholder`,
                status: "success",
                duration: 2000,
                position: "top",
            });
            */
        } catch (e: any) {
            const msg = `Error failed to fetch general admission viewer ${e}`;
            console.error(msg);
            toast({
                ...toastDefaultOptions,
                description: msg,
                status: "error",
                duration: 7000,
            });
            return;
        }
    };

    const getRallyHistory = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get<RallyHistoryResponse>(
                `/api/boosts/getBoostsSegments?stageId=${stageId}`
            );
            if (response.data.success) {
                setRallyHistory(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch rally history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEventLeaderboard = async () => {
        try {
            const { data }: { data: WildcardApiResponse } = await axios.get(
                `/api/fetchEvent?vendorEventId=${vendorEventId}`
            );
            if (!data.success) {
                const msg = `Failed to fetch event: ${data.err}`;
                toast({
                    ...toastDefaultOptions,
                    description: msg,
                    status: "error",
                    duration: 7000,
                });
                return;
            }

            const event: IStage = data.data;

            setLeaderboard(event.users);
        } catch (e: any) {
            const msg = `Error unable to fetch event ${e}`;
            console.error(msg);
            toast({
                ...toastDefaultOptions,
                description: msg,
                status: "error",
                duration: 7000,
            });
            return;
        }
    };

    const safeFetchEventLeaderboard = async () => {
        if (isFetchingLeaderboard) return;

        setIsFetchingLeaderboard(true);
        try {
            await fetchEventLeaderboard();
        } finally {
            setIsFetchingLeaderboard(false);
        }
    };

    // Trigger polling to true for every 30 sec
    useEffect(() => {
        const polling = setInterval(() => {
            setAutoPolling(true);
        }, AUTO_POLLING_INTERVAL_MS);
        return () => {
            setAutoPolling(false);
            clearInterval(polling);
        };
    }, []);

    // Render updated competitor list when auto polling set to true
    useEffect(() => {
        if (autoPolling) {
            fetchEventLeaderboard();
            fetchGeneralAdmissionViewers();
            setAutoPolling(false);
        }
    }, [autoPolling]);

    useEffect(() => {
        const setEventDetails = async () => {
            const resposne = await fetchEventDetails(vendorEventId);
            setEvent(resposne);
        };

        setEventDetails();
        safeFetchEventLeaderboard();
    }, [vendorEventId]);

    //Get Rally History on page load
    useEffect(() => {
        getRallyHistory();
    }, [stageId]);

    const renderEditEventButtonJSX = (onEdit: () => void) => {
        if (userRole === "developer" || userRole === "admin") {
            return (
                <IconButton
                    aria-label="Edit event"
                    icon={<EditIcon />}
                    onClick={() => {
                        onEdit();
                    }}
                />
            );
        }
    };

    const generateCompetitorAccessCode = async (numberOfUses: number) => {
        try {
            let accessCodeType = AccessCodeType.SINGLE_USE;
            if (numberOfUses > 1) {
                accessCodeType = AccessCodeType.MULTI_USE;
            }

            const response = await axios.post(
                "/api/accessCode/generateAccessCode",
                {
                    organizationId: null,
                    isClaimed: false,
                    codeType: accessCodeType,
                    count: 1,
                    maxQuantity: numberOfUses,
                    intent: AccessCodeIntent.ACCESS_ROLE, // Set the intent to ACCESS_ROLE
                    accessRoles: [UserRole.COMPETITOR], // Pass the access roles
                }
            );

            if (
                response.data.accessCodes &&
                response.data.accessCodes.length > 0
            ) {
                return response.data.accessCodes[0];
            } else {
                return "";
            }
        } catch (error: any) {
            console.log(
                "generateCompetitorAccessCode: ",
                error.response?.data?.message ||
                "Failed to generate access code"
            );

            return "";
        }
    };

    const copyCompetitorLinkWithAccessCodeToClipboard = async (
        competitorUrl: string,
        numberOfUses: number
    ) => {
        //Close the Share Competitor Link dialog
        setIsShareCompetitorLinkModalOpen(false);
        //Generate an access code based on the required numberOfUses
        const competitorAccessCode = await generateCompetitorAccessCode(
            numberOfUses
        );
        //Append the redirectUrl and the accessCode (in the future we should be able to link directly to the redirectUrl without linking to the login page)
        const competitorLinkWithAccessCode =
            window.location.origin +
            competitorUrl +
            `?accessCode=${competitorAccessCode}`;
        //Copy the competitor signup link to the clipboard
        copyTextToClipboard(
            competitorLinkWithAccessCode,
            setToolTipText,
            EVENT_COPIED_MSG
        );
    };

    /**
     * Copies text to clipboard
     * @param text - text to copy
     * @param setText - sets the text of the tooltip surrounding the text
     */
    const copyTextToClipboard = (
        text: string,
        setText?: Dispatch<SetStateAction<string>>,
        msg?: string
    ) => {
        // Use the modern Clipboard API if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (setText) {
                    setText("Copied!");
                    toast({
                        ...toastDefaultOptions,
                        description: msg,
                        status: "success",
                        duration: 7000,
                    });
                }
            });
            return;
        }
        // Create a temporary textarea element to hold the text
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);

        // Select the text in the textarea
        textarea.select();

        // Execute the copy command
        document.execCommand("copy");

        // Remove the temporary textarea
        document.body.removeChild(textarea);
        if (setText) {
            setText("Copied!");
            toast({
                ...toastDefaultOptions,
                description: msg,
                status: "success",
                duration: 7000,
            });
        }
    };

    const handleStartEvent = async () => {
        if (confirm("Are you sure you want to start this event?")) {
            const { data }: { data: WildcardApiResponse } = await axios.post(
                "/api/events/startEvent",
                { eventId: eventId.toString() },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (!data.success) {
                console.log(data.err);
                toast({
                    description: data.err,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }
            setCurrentEventStatus(EventStatus.LIVE);
        }
    };

    const handleEndEvent = async () => {
        if (confirm("Are you sure you want to end this event?")) {
            const { data }: { data: WildcardApiResponse } = await axios.post(
                "/api/events/endEvent",
                { eventId: eventId.toString() },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            if (!data.success) {
                console.log(data.err);
                toast({
                    description: data.err,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }
            setCurrentEventStatus(EventStatus.COMPLETED);
        }
    };

    const handleToggleCreateMatch = () => {
        setOpen(!open);
    };

    const handleCancelCreateMatch = () => {
        setTeamAssignments({ team1: [], team2: [] });
        handleToggleCreateMatch();
    };

    const renderCompetitorCard = (competitor: any) => {
        return (
            <Card sx={{ height: "75px", justifyContent: "center" }}>
                <Text as="samp" fontSize={"medium"}>
                    {competitor}
                </Text>
                {/* <Text textAlign={"center"}>Winner</Text> */}
            </Card>
        );
    };

    const renderCompetitors = () => {
        return leaderboard.map((competitor: IUser, index: number) => {
            return renderTableRow(competitor, index);
        });
    };

    const renderTableRow = (competitor: IUser, index: number) => {
        const gameMode = getGameMode();
        const allowedPerTeam =
            gameMode === GAME_MODE["1V1"]
                ? 1
                : gameMode === GAME_MODE["2v2"]
                    ? 2
                    : 0;
        const isAssignedToTeam1 = teamAssignments.team1.some(
            (c: IUser) => c?._id?.toString() === competitor?._id?.toString()
        );
        const isAssignedToTeam2 = teamAssignments.team2.some(
            (c: IUser) => c?._id?.toString() === competitor?._id?.toString()
        );
        const currentAssignment = isAssignedToTeam1
            ? "Team 1"
            : isAssignedToTeam2
                ? "Team 2"
                : "None";
        const displayName = getUserDisplayName(competitor);
        const key = competitor._id ? competitor._id.toString() : index;
        // Function to assign competitor to a team or none
        const assignCompetitor = (value: "none" | "team1" | "team2") => {
            setTeamAssignments((prev) => {
                const newTeam1 = prev.team1.filter(
                    (old) =>
                        old?._id?.toString() !== competitor?._id?.toString()
                );
                const newTeam2 = prev.team2.filter(
                    (old) =>
                        old?._id?.toString() !== competitor?._id?.toString()
                );
                if (value === "team1" && newTeam1.length < allowedPerTeam) {
                    newTeam1.push(competitor);
                }
                if (value === "team2" && newTeam2.length < allowedPerTeam) {
                    newTeam2.push(competitor);
                }
                return { team1: newTeam1, team2: newTeam2 };
            });
        };
        return (
            <Tr
                key={key}
                _last={{
                    "& td": {
                        borderColor: "transparent",
                    },
                }}
            >
                <Td paddingLeft={"8px"} paddingRight={"0"} width={"10px"}>
                    <Menu>
                        <MenuButton as={Button} size="sm">
                            {currentAssignment}
                        </MenuButton>
                        <MenuList>
                            <MenuItem onClick={() => assignCompetitor("none")}>
                                None
                            </MenuItem>
                            <MenuItem
                                onClick={() => assignCompetitor("team1")}
                                disabled={
                                    teamAssignments.team1.length >=
                                    allowedPerTeam && !isAssignedToTeam1
                                }
                            >
                                Team 1
                            </MenuItem>
                            <MenuItem
                                onClick={() => assignCompetitor("team2")}
                                disabled={
                                    teamAssignments.team2.length >=
                                    allowedPerTeam && !isAssignedToTeam2
                                }
                            >
                                Team 2
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </Td>
                <Td>{displayName}</Td>
                <Td py={0}>
                    <Button m={0} onClick={() => setUserToRename(competitor)}>
                        Rename User
                    </Button>
                </Td>
            </Tr>
        );
    };

    const getMatches = (event: EventCreationPayload) => {
        if (!event) {
            return [];
        }

        const rules = event.content.phases[0]?.rules;
        const matches = rules.filter((rule) => {
            return rule.rule.includes("Match");
        });

        return matches;
    };

    const getCameraOperatorGamerTag = (event: EventCreationPayload) => {
        if (!event) {
            return "";
        }

        const rules = event.content.phases[0]?.rules;
        const cameraOperator = rules.filter((rule) => {
            return rule.rule.includes("cameraoperator");
        });

        if (cameraOperator == null || cameraOperator.length < 1) {
            return "";
        }

        return cameraOperator[0].value;
    };

    const eventTypeDisplayName = (eventType: string) => {
        if (eventType === "show_match") {
            return "Exhibition";
        } else {
            return eventType;
        }
    };

    const renderCompetitorMatches = () => {
        if (!event) {
            return;
        }

        const isSoloMatch = GAME_MODE["1V1"] === event.content?.gameMode;
        const matches = getMatches(event);

        if (matches.length === 0) {
            return <></>;
        }

        return (
            <Accordion allowToggle>
                <AccordionItem>
                    <AccordionButton>
                        <Box
                            as={Text}
                            fontSize={"large"}
                            flex="1"
                            textAlign="left"
                        >
                            Competitor Matches
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel
                        pb={4}
                        sx={{
                            display: "flex",
                            gap: 4,
                            flexDirection: "column",
                        }}
                    >
                        {matches.map((match, index: number) => {
                            const matchContent = JSON.parse(match.value);
                            const competitors = matchContent.competitors;
                            const matchState = matchContent.matchState;
                            const matchId = matchContent.matchId;

                            return (
                                <Card
                                    key={index}
                                    border="1px white solid"
                                    style={{ padding: "20px" }}
                                >
                                    <IconButton
                                        aria-label="Delete"
                                        icon={<CloseIcon />}
                                        hidden={
                                            matchState.toUpperCase() ===
                                            "COMPLETED"
                                        }
                                        position={"absolute"}
                                        bg={"transparent"}
                                        top={0}
                                        right={0}
                                        onClick={() =>
                                            setEventToCancel({
                                                vendorEventId,
                                                matchId,
                                            })
                                        }
                                    />
                                    <Text textAlign="center">
                                        State: {matchState}
                                    </Text>
                                    {isSoloMatch ? (
                                        <HStack
                                            sx={{
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            {renderCompetitorCard(
                                                competitors[0]
                                            )}

                                            <Box>
                                                <Text>VS</Text>
                                            </Box>
                                            {renderCompetitorCard(
                                                competitors[1]
                                            )}
                                        </HStack>
                                    ) : (
                                        <HStack
                                            sx={{
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            {renderCompetitorCard(
                                                competitors[0]
                                            )}
                                            {renderCompetitorCard(
                                                competitors[1]
                                            )}
                                            <Box>
                                                <Text>VS</Text>
                                            </Box>
                                            {renderCompetitorCard(
                                                competitors[2]
                                            )}
                                            {renderCompetitorCard(
                                                competitors[3]
                                            )}
                                        </HStack>
                                    )}
                                </Card>
                            );
                        })}
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        );
    };

    const renderStartOrEndEventButton = (eventStatus: string) => {
        if (eventStatus === EventStatus.LIVE) {
            return (
                <Flex>
                    <Button
                        onClick={() => handleEndEvent()}
                        leftIcon={<CloseIcon />}
                    >
                        End Event
                    </Button>
                </Flex>
            );
        } else {
            return (
                <Flex>
                    <Button
                        onClick={() => handleStartEvent()}
                        leftIcon={<CheckIcon />}
                    >
                        Start Event
                    </Button>
                </Flex>
            );
        }
    };

    //const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { serverCode } = router.query as { serverCode: string };
    const liveEventRouteUrl = WILDFILE_ROUTES.SERVER.EVENTS.EVENT_ID.url;
    const formattedLiveEventRouteUrl = formatRouteConfigUrl(liveEventRouteUrl, {
        serverCode,
        id: eventId,
    });
    const shareUrl = window.location.origin + formattedLiveEventRouteUrl;

    const competitorRouteUrl =
        WILDFILE_ROUTES.SERVER.EVENT_DASHBOARD.LIVE.EVENT.BASE.url;
    const formattedCompetitorRouteUrl = formatRouteConfigUrl(
        competitorRouteUrl,
        {
            serverCode,
            eventId: vendorEventId,
        }
    );
    const competitorUrl = formattedCompetitorRouteUrl;

    const backToEventRouteUrl = WILDFILE_ROUTES.SERVER.EVENT_DASHBOARD.BASE.url;
    const formattedBackToEventRouteUrl = formatRouteConfigUrl(
        backToEventRouteUrl,
        {
            serverCode,
        }
    );
    const backToEventUrl = formattedBackToEventRouteUrl;
    const [currentSegment, setCurrentSegment] = useState<number>(segment);
    // @todo use formik/yup in future
    const handleSubmitAirdop = async () => {
        if (!airdropId) {
            toast({
                description: "No airdrop was selected",
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }

        if (0 >= airdropQuantity || airdropQuantity > 100) {
            toast({
                description: "Quantity cannot below 1 or above 100",
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }

        // @todo api call and other logic
        const airdrop = airdropGifts.find(
            (airdrop) => airdrop.Id === airdropId
        );
        if (!airdrop) {
            toast({
                description: `Failed to find id ${airdropId}`,
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }

        try {
            const response = await axios.post("/api/airdrop/startAirdrop", {
                vendorEventId,
                giftId: airdropId,
                giftQuantity: airdropQuantity,
            });

            if (response.data.success) {
                toast({
                    description: "Airdrop Initiated",
                    status: "success",
                    duration: 2000,
                    position: "top",
                });
            }
        } catch (e: any) {
            const msg = `Error starting airdrop: ${e.message}`;
            console.error(msg);
            toast({
                description: msg,
                status: "error",
                duration: 5000,
                position: "top",
            });
        }

        //Reset UI
        setAirdropId("");
        setAirdropQuantity(1);
    };

    const renderAirdropGift = () => {
        return (
            <RadioGroup value={airdropId} onChange={setAirdropId}>
                <Stack spacing={4} direction="row">
                    {airdropGifts.map((airdrop) => {
                        return (
                            <Radio key={airdrop.Id} value={airdrop.Id}>
                                {airdrop.Name}
                            </Radio>
                        );
                    })}
                </Stack>
            </RadioGroup>
        );
    };

    const renderAirdropQuantityInput = () => {
        return (
            <Box>
                <NumberInput
                    maxW="100px"
                    mr="2rem"
                    max={100}
                    min={1}
                    defaultValue={1}
                    clampValueOnBlur={false}
                    value={airdropQuantity}
                    onChange={handleChangeAirdropQuantity}
                    display={"inline-block"}
                >
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
                <Button
                    sx={{
                        display: "inline-block",
                        bgColor: THEME_COLOR_DARK_GOLDEN_YELLOW,
                        verticalAlign: "top",
                    }}
                    size="md"
                    onClick={handleSubmitAirdop}
                >
                    Submit Airdrop
                </Button>
            </Box>
        );
    };

    const renderAirdropForm = () => {
        return (
            <Stack
                sx={{
                    padding: "40px",
                    borderRadius: "16px",
                    border: "1px solid gray",
                }}
            >
                {renderAirdropGift()}
                {renderAirdropQuantityInput()}
            </Stack>
        );
    };

    const handleGetWalletAddresses = async (count?: number) => {
        await fetchWalletAddresses(count);
    };

    const handleAdvanceQueue = async () => {
        try {
            const wildcardAccessToken = Cookies.get(
                COOKIES_ACCESS_TOKEN_WILDCARD
            );
            const advanceQueueApiUrl = getQueueApiUrl() + "/advance";
            const response = await axios.post(
                advanceQueueApiUrl,
                {
                    QueueId: eventId,
                    AmountToAdvanceTheQueue: numQueueToAdvance,
                },
                {
                    headers: {
                        Authorization: `Bearer ${wildcardAccessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status !== 200) {
                toast({
                    description: `Unable to advance ${numQueueToAdvance} position in queue `,
                    status: "success",
                    duration: 2000,
                    position: "top",
                });
                return;
            }

            toast({
                description: `Advance ${numQueueToAdvance} position in queue `,
                status: "success",
                duration: 2000,
                position: "top",
            });
        } catch (e: any) {
            const msg = `Error failed to advance ${numQueueToAdvance} in queue: ${e.message}`;
            console.error(msg);
            toast({
                description: msg,
                status: "error",
                duration: 5000,
                position: "top",
            });
        }

        //Reset UI
        setNumQueueToAdvance(1);
    };

    const renderAdvanceQueueInput = () => {
        return (
            <Box>
                <NumberInput
                    maxW="100px"
                    mr="2rem"
                    max={100}
                    min={1}
                    defaultValue={1}
                    clampValueOnBlur={false}
                    value={numQueueToAdvance}
                    onChange={handleChangeNumQueueToAdvance}
                    display={"inline-block"}
                >
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
                <Button
                    sx={{
                        display: "inline-block",
                        bgColor: THEME_COLOR_DARK_GOLDEN_YELLOW,
                        verticalAlign: "top",
                    }}
                    size="md"
                    onClick={handleAdvanceQueue}
                >
                    Advance the Queue
                </Button>
            </Box>
        );
    };

    const handleCopyWalletAddressesToClipboard = () => {
        const walletAddressesJsonString = JSON.stringify(walletAddresses);

        copyTextToClipboard(
            walletAddressesJsonString,
            setToolTipText,
            "Copied Wallets to Clipboard!"
        );
    };

    const [numberOfWalletAddresses, setNumberOfWalletAddresses] = useState(1);
    const [hasError, setHasError] = useState(false);

    const handleWalletCountChange = (value: string) => {
        const numericValue = parseFloat(value);
        const _hasError = isNaN(numericValue) || numericValue < 1;
        setHasError(_hasError);

        if (!_hasError) setNumberOfWalletAddresses(parseInt(value));
    };

    const renderGetWalletAddresses = () => {
        const walletAddressesJsonString = JSON.stringify(walletAddresses);

        return (
            <>
                <Box gap={2}>
                    <Button
                        sx={{
                            display: "inline-block",
                            bgColor: THEME_COLOR_DARK_GOLDEN_YELLOW,
                            verticalAlign: "top",
                            mr: "8px",
                        }}
                        size="md"
                        onClick={() => handleGetWalletAddresses()}
                    >
                        Get Wallet Addresses
                    </Button>
                    <Button
                        sx={{
                            display: "inline-block",
                            bgColor: THEME_COLOR_DARK_GOLDEN_YELLOW,
                            verticalAlign: "top",
                        }}
                        size="md"
                        onClick={handleCopyWalletAddressesToClipboard}
                    >
                        Copy to Clipboard
                    </Button>
                    <InputGroup gap={2} py={2}>
                        <Input
                            pr="4.5rem"
                            type="number"
                            min={1}
                            placeholder="Enter Number"
                            value={numberOfWalletAddresses}
                            onChange={(e) =>
                                handleWalletCountChange(e.target.value)
                            }
                            w={["100%", "100%", "100%", "300px"]}
                            className={`w-full px-4 py-3 bg-[#1E1F23] text-white rounded-lg 
                                transition-all placeholder-blue-400
                                ${hasError
                                    ? "ring-2 ring-red-500/50 border-red-500"
                                    : "focus:outline-none focus:ring-2 focus:ring-blue-500 border-transparent"
                                }`}
                        />
                        <Button
                            sx={{
                                display: "inline-block",
                                bgColor: THEME_COLOR_DARK_GOLDEN_YELLOW,
                            }}
                            onClick={() =>
                                handleGetWalletAddresses(
                                    numberOfWalletAddresses
                                )
                            }
                        >
                            {`Get ${numberOfWalletAddresses} Wallet Address${numberOfWalletAddresses > 1 ? "es" : ""
                                }`}
                        </Button>
                    </InputGroup>
                </Box>
                <Textarea value={walletAddressesJsonString} />
            </>
        );
    };

    const renderAdvanceQueue = () => {
        return (
            <Stack
                sx={{
                    padding: "40px",
                    borderRadius: "16px",
                    border: "1px solid gray",
                }}
            >
                {renderAdvanceQueueInput()}
            </Stack>
        );
    };

    const refereeProcessResult = async (config: {
        totalTokens: number;
        maxTokensPerUser: number;
        numberOfUsersDistributed: number;
        minimumTokenEligibilityThreshold: number;
    }) => {
        try {
            setIsLoading(true);
            const response = await axios.get(
                `/api/pledgeAI/get?vendorEventId=${vendorEventId}&stageId=${eventId}&segment=${currentSegment}` +
                `&totalTokens=${config.totalTokens}` +
                `&maxTokensPerUser=${config.maxTokensPerUser}` +
                `&minimumTokenEligibilityThreshold=${config.minimumTokenEligibilityThreshold}`
            );
            const pledgeAIResponse = response.data;
            const pledgeAIDistribution = pledgeAIResponse.data;
            setRefereeResults(pledgeAIDistribution);
            setIsLoading(false);
        } catch (error: any) {
            console.error("Failed to get response from LLM", error);
            setIsLoading(false);
        }
    };

    const refereeProcessApprove = async () => {
        try {
            setIsLoading(true);

            const body = { ...refereeResults, stageId: eventId };
            const response = await axios.post(
                "/api/distributeRefereeRewards",
                body
            );

            setIsLoading(false);

            if (!response) {
                const msg = "Error distributing tokens";
                toast({
                    description: msg,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }

            const distributeRewardResponse = response.data;
            if (!distributeRewardResponse.success) {
                toast({
                    description: distributeRewardResponse.err,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }

            const distributeReward = distributeRewardResponse.data;
            setCurrentSegment(distributeReward.currentSegment);
            setRefereeResults(null);

            const msg = "Tokens distributed!";
            toast({
                description: msg,
                status: "success",
                duration: 2000,
                position: "top",
            });
        } catch (e: any) {
            console.log("Failed to get response from distributor", e);
            setRefereeResults(null);
            setIsLoading(false);
        }
    };

    const refereeProcessCancel = () => {
        setRefereeResults(null);
        setIsLoading(false);
    };

    const renderWinnerSelector = () => {
        return (
            <Stack
                sx={{
                    padding: "30px",
                    borderRadius: "16px",
                    border: "1px solid gray",
                }}
            >
                <Flex justifyContent="start">
                    <MatchWinnerSelector
                        stageId={eventId}
                        onWinnerSet={(winner) => {
                            onMessage({
                                title: `${winner.charAt(0).toUpperCase() +
                                    winner.slice(1)
                                    } team wins!`,
                                description:
                                    "The match results have been recorded",
                                status: "success",
                                duration: 3000,
                                isClosable: true,
                            });
                        }}
                    />
                </Flex>
                <Box mt={8}>
                    <Text fontSize="xl" fontWeight="bold" mb={4}>
                        Rally History
                    </Text>
                    <Button
                        onClick={getRallyHistory}
                        bg={THEME_COLOR_DARK_GOLDEN_YELLOW}
                        size="sm"
                    >
                        Refresh
                    </Button>
                </Box>
                {renderRallyHistory()}
            </Stack>
        );
    };

    const renderRallyHistory = () => {
        if (isLoading) {
            return <Skeleton height="200px" />;
        }

        if (!rallyHistory) {
            return <Text color="gray.500">No rally history available</Text>;
        }

        return (
            <Table size="sm" variant="simple">
                <Thead>
                    <Tr>
                        <Th>Match #</Th>
                        <Th># of Rallies</Th>
                        <Th>Credits Spent</Th>
                        <Th>Winner</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {rallyHistory.map((rallyResult, rallyIndex) => (
                        <Tr key={rallyResult.segment}>
                            <Td>{rallyResult.segment + 1}</Td>
                            <Td>
                                {rallyResult.boosts?.length.toLocaleString() ??
                                    "Error"}
                            </Td>
                            <Td>
                                {rallyResult.boosts
                                    ?.reduce(
                                        (sum, item) => sum + item.boostPrice,
                                        0
                                    )
                                    .toLocaleString() ?? "Error"}
                            </Td>
                            <Td>
                                {rallyResult.boosts?.length > 0
                                    ? rallyResult.boosts[0].boostAmount > 0
                                        ? rallyResult.boosts[0].boostType
                                        : rallyResult.boosts[0].boostType ===
                                            "blue"
                                            ? "red"
                                            : "blue"
                                    : "Error"}
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        );
    };

    const renderRallyControls = () => {
        return (
            <Stack
                sx={{
                    padding: "30px",
                    borderRadius: "16px",
                    border: "1px solid gray",
                }}
            >
                <Flex justifyContent="start">
                    <RallyControls vendorEventId={vendorEventId} />
                </Flex>
            </Stack>
        );
    };

    const renderReferee = () => {
        return (
            <>
                <div className="flex flex-col gap-2 p-[40px] rounded-2xl border-solid border-gray-400 border">
                    <h2 className="leading-[1.2] text-4xl font-black">
                        Referee
                    </h2>
                    <div>
                        {/* <button
                            className="inline-flex items-center justify-center whitespace-nowrap leading-[1.2] 
                        outline-offset-2 outline outline-transparent outline-2 rounded bg-[#d2a522] ps-4 pe-4
                        text-base text-semibold h-10 min-w-10"
                        >
                            Make a Call
                        </button> */}
                        {!refereeResults && (
                            <Button
                                onClick={onOpen}
                                isLoading={isLoading}
                                sx={{
                                    bgColor: "#d2a522",
                                }}
                            >
                                Make a Call
                            </Button>
                        )}

                        {isLoading && (
                            <Text
                                sx={{
                                    color: "#d2a522",
                                    fontSize: "sm",
                                    paddingY: "10px",
                                }}
                            >
                                Making a call...
                            </Text>
                        )}
                        {refereeResults && (
                            <Button
                                onClick={refereeProcessApprove}
                                sx={{
                                    bgColor: "#d2a522",
                                }}
                                mr={8}
                                isLoading={isLoading}
                            >
                                Approve
                            </Button>
                        )}
                        {refereeResults && (
                            <Button
                                onClick={refereeProcessCancel}
                                sx={{
                                    bgColor: "#88",
                                }}
                                mr={4}
                                isLoading={isLoading}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                    <Code
                        whiteSpace={"pre-wrap"}
                        display={refereeResults ? "block" : "none"}
                    >
                        {JSON.stringify(refereeResults, null, 2)}
                    </Code>

                    {refereeResults && refereeResults.insights && (
                        <InsightsCopyField insights={refereeResults.insights} />
                    )}

                    {refereeResults && refereeResults.walletRecipients && (
                        <WalletRecipientsCSV
                            recipients={refereeResults.walletRecipients}
                        />
                    )}
                </div>
            </>
        );
    };

    const [voteOptions, setVoteOptions] = useState<VoteOption[]>([
        { id: "1", name: "Team 1", color: VOTE_TEAM_COLORS[0] },
        { id: "2", name: "Team 2", color: VOTE_TEAM_COLORS[1] },
    ]);

    if (!event) {
        return <div>Loading...</div>;
    }

    return (
        <Card
            // maxW="xl"
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            p={4}
            mb={4}
            shadow="md"
            minW={"1280px"}
            _hover={{ shadow: "xl" }}
        >
            <VStack spacing={4} align="stretch">
                <Flex my="5px" flexDirection={"column"}>
                    <Link href={backToEventUrl}>
                        {/* Todo should go back to previous route */}
                        <Button
                            size="sm"
                            variant="link"
                            leftIcon={<FaChevronLeft />}
                            textTransform="uppercase"
                        >
                            Back to Events
                        </Button>
                    </Link>
                </Flex>
                <Divider />

                <Flex
                    flexDirection={"row"}
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Text as="h3" size="md" fontSize={"2xl"}>
                        {event.content.name}: {currentEventStatus.toUpperCase()}
                    </Text>
                    {(userRole === "developer" || userRole === "admin") && (
                        <IconButton
                            size="sm"
                            aria-label="Edit event"
                            icon={<EditIcon />}
                            onClick={onEdit}
                        />
                    )}
                </Flex>

                <Divider />

                <HStack justifyContent={"space-between"}>
                    <Flex alignItems={"center"} gap={2}>
                        <Icon as={FaRegCalendarAlt} />
                        <Text fontSize="md">
                            Start:{" "}
                            {new Date(
                                event.content.start_date
                            ).toLocaleString()}
                        </Text>
                    </Flex>
                    <Flex alignItems={"center"} gap={2}>
                        <Text fontSize="md">{leaderboard.length}</Text>
                        <Icon as={IoIosPeople} />
                        <Text fontSize="md">{generalAdmissionViewers}</Text>
                        <Icon as={FaTicketAlt} />
                    </Flex>
                </HStack>

                <Divider />

                {event.content.phases.map((phase, index) => (
                    <Card
                        key={index}
                        border="1px white solid"
                        style={{ padding: "20px" }}
                    >
                        {phase.rules.map((rule, ruleIndex) => {
                            if (
                                rule.rule !==
                                BEAMABLE_RULE_NAMES.EVENT_TYPE_RULE
                            ) {
                                return null;
                            }

                            return (
                                <HStack key={ruleIndex} spacing={2}>
                                    {rule.rule ===
                                        BEAMABLE_RULE_NAMES.EVENT_TYPE_RULE && (
                                            <>
                                                <IoLogoGameControllerB />
                                                Event Type:
                                            </>
                                        )}
                                    <Text fontSize="sm">
                                        {eventTypeDisplayName(rule.value)}
                                    </Text>
                                </HStack>
                            );
                        })}
                        <Flex
                            sx={{
                                flexDirection: "column",
                            }}
                        >
                            <Box p="6">
                                <HStack>
                                    <HStack key={"ingestEndpoint"} spacing={2}>
                                        <Tooltip
                                            label={toolTipText}
                                            placement="top"
                                            hasArrow
                                            onClose={() =>
                                                setToolTipText("Copy")
                                            }
                                        >
                                            <Flex>
                                                <Button
                                                    onClick={() =>
                                                        copyTextToClipboard(
                                                            "rtmps://" +
                                                            ingestEndpoint,
                                                            setToolTipText,
                                                            EVENT_COPIED_MSG
                                                        )
                                                    }
                                                    leftIcon={<LinkIcon />}
                                                >
                                                    Copy Stream Server
                                                </Button>
                                            </Flex>
                                        </Tooltip>
                                    </HStack>
                                    <HStack key={"streamKey"} spacing={2}>
                                        <Tooltip
                                            label={toolTipText}
                                            placement="top"
                                            hasArrow
                                            onClose={() =>
                                                setToolTipText("Copy")
                                            }
                                        >
                                            <Flex>
                                                <Button
                                                    onClick={() =>
                                                        copyTextToClipboard(
                                                            streamKey,
                                                            setToolTipText,
                                                            EVENT_COPIED_MSG
                                                        )
                                                    }
                                                    leftIcon={<LockIcon />}
                                                >
                                                    Copy Stream Key
                                                </Button>
                                            </Flex>
                                        </Tooltip>
                                    </HStack>
                                    {/*phase.rules.map((rule, ruleIndex) => {
                                        if (
                                            rule.rule !==
                                            "cameraOperatorParticipantToken"
                                        ) {
                                            return null;
                                        }

                                        return (
                                            <HStack
                                                key={rule.value}
                                                spacing={2}
                                            >
                                                <Tooltip
                                                    label={toolTipText}
                                                    placement="top"
                                                    hasArrow
                                                    onClose={() =>
                                                        setToolTipText("Copy")
                                                    }
                                                >
                                                    <Flex>
                                                        <Button
                                                            onClick={() =>
                                                                copyTextToClipboard(
                                                                    rule.value,
                                                                    setToolTipText,
                                                                    CAMERA_OPERATOR_COPIED_MSG
                                                                )
                                                            }
                                                            leftIcon={
                                                                <LinkIcon />
                                                            }
                                                        >
                                                            Copy Camera Operator
                                                            Streaming Token
                                                        </Button>
                                                    </Flex>
                                                </Tooltip>
                                            </HStack>
                                        );
                                    })*/}
                                    <HStack key={"eventUrl"} spacing={2}>
                                        <Tooltip
                                            label="Share this event link"
                                            placement="top"
                                            hasArrow
                                            onClose={() =>
                                                setToolTipText("Copy")
                                            }
                                        >
                                            <Flex>
                                                <Button
                                                    onClick={() =>
                                                        setIsShareEventLinkModalOpen(
                                                            true
                                                        )
                                                    }
                                                    leftIcon={<LinkIcon />}
                                                >
                                                    Share Event Link
                                                </Button>
                                            </Flex>
                                        </Tooltip>
                                    </HStack>
                                    <HStack key={"competitorUrl"} spacing={2}>
                                        <Tooltip
                                            label={toolTipText}
                                            placement="top"
                                            hasArrow
                                            onClose={() =>
                                                setToolTipText("Copy")
                                            }
                                        >
                                            <Flex>
                                                <Button
                                                    onClick={() =>
                                                        setIsShareCompetitorLinkModalOpen(
                                                            true
                                                        )
                                                    }
                                                    leftIcon={<LinkIcon />}
                                                >
                                                    Share Competitor Link
                                                </Button>
                                            </Flex>
                                        </Tooltip>
                                    </HStack>
                                    <HStack spacing={2}>
                                        {renderStartOrEndEventButton(
                                            currentEventStatus
                                        )}
                                    </HStack>
                                    <CompetitorSignUpAccessCodeModal
                                        competitorSignUpUrl={competitorUrl}
                                        isOpen={isShareCompetitorLinkModalOpen}
                                        onCopy={
                                            copyCompetitorLinkWithAccessCodeToClipboard
                                        }
                                        onCancel={() =>
                                            setIsShareCompetitorLinkModalOpen(
                                                false
                                            )
                                        }
                                    />
                                </HStack>
                            </Box>
                            <Box>
                                <Box>Game Mode: {event?.content.gameMode}</Box>
                                <HStack>
                                    <Box p="4">
                                        <HStack
                                            flexDirection={"column"}
                                            alignItems={"flex-start"}
                                            key={"createMatch"}
                                            spacing={2}
                                        >
                                            <Flex>
                                                <Button
                                                    onClick={
                                                        handleCancelCreateMatch
                                                    }
                                                    backgroundColor={
                                                        THEME_COLOR_DARK_GOLDEN_YELLOW
                                                    }
                                                    isDisabled={
                                                        GAME_MODE.NONE ===
                                                        event?.content?.gameMode
                                                    }
                                                >
                                                    Create Match
                                                </Button>
                                            </Flex>
                                        </HStack>
                                    </Box>
                                </HStack>
                            </Box>
                        </Flex>
                        <VStack
                            id="competitor-list"
                            borderWidth="4px"
                            borderRadius="lg"
                            overflow="hidden"
                            p={4}
                            mb={4}
                            shadow="md"
                            w="100%"
                            alignItems={"flex-start"}
                            _hover={{ shadow: "xl" }}
                            hidden={!open}
                        >
                            <VStack
                                overflow="auto"
                                overflowX={"hidden"}
                                height="350px"
                                w="100%"
                            >
                                <Table variant="striped" colorScheme={"yellow"}>
                                    <Thead>
                                        <Tr>
                                            <Th
                                                paddingLeft={"8px"}
                                                paddingRight={"0"}
                                                width={"10px"}
                                            />
                                            <Th>Name</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>{renderCompetitors()}</Tbody>
                                </Table>
                            </VStack>
                            <Flex
                                justifyContent={"space-between"}
                                w="100%"
                                flexDirection={"row-reverse"}
                            >
                                <Flex gap={2}>
                                    <Button
                                        onClick={handleCancelCreateMatch}
                                        fontSize={"small"}
                                        colorScheme="red"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            createMatch();
                                            handleToggleCreateMatch();
                                        }}
                                        isDisabled={checkCreateMatchIsDisabled()}
                                        colorScheme="green"
                                        fontSize={"small"}
                                    >
                                        Create
                                    </Button>
                                </Flex>
                            </Flex>
                        </VStack>
                    </Card>
                ))}
                <Divider />
                {renderCompetitorMatches()}
                <Divider />
                {renderRallyControls()}
                <Divider />
                {renderWinnerSelector()}
                <Divider />
                {renderAdvanceQueue()}
                {/*renderGetWalletAddresses()*/}
                {/* Admin tools to generate/award access codes */}
                <Divider />
                <Flex flexDirection={"column"} h="100px">
                    <Button
                        onClick={() => setIsGenerateModalOpen(true)}
                        mt={"10px"}
                        bg={THEME_COLOR_DARK_GOLDEN_YELLOW}
                    >
                        Generate Access Codes
                    </Button>
                    <AccessCodeGenerationModal
                        isOpen={isGenerateModalOpen}
                        onClose={() => setIsGenerateModalOpen(false)}
                        seriesId={seriesId}
                    />
                    <AwardTicketQueueVouchers />
                    <ShareEventLinkModal
                        isOpen={isShareEventLinkModalOpen}
                        onClose={() => setIsShareEventLinkModalOpen(false)}
                        eventLink={shareUrl}
                        seriesId={seriesId}
                    />
                </Flex>
                <AdminUserControl eventId={eventId} />
                <Divider />
                {userRole === UserRole.ADMIN && (
                    <DownloadChatSpreadsheet beamableEventId={vendorEventId} />
                )}
                <Divider />
                <VotingConfigSection stageId={eventId} />
                {/*
                <Divider />
                <SkyboxConfigSection
                    skyboxTiers={skyboxTiers}
                    setSkyboxTiers={setSkyboxTiers}
                    onSave={() => {
                        console.log('Saving skybox configuration:', skyboxTiers);
                        // TODO: Hook up to database
                    }}
                />*/}
            </VStack>
            <Divider h="10px" mt={2} />
            <CancelEventMatchModal
                matchId={eventToCancel?.matchId}
                vendorEventId={eventToCancel?.vendorEventId}
                setMatchToCancel={setEventToCancel}
                setEvent={setEvent}
            />
            <RenameUserModal
                userToRename={userToRename}
                setUserToRename={setUserToRename}
                refreshLeaderBoard={safeFetchEventLeaderboard}
            />
            <TokenDistributionConfigModal
                isOpen={isOpen}
                onClose={onClose}
                onCall={(config) => {
                    refereeProcessResult(config);
                }}
            />
        </Card>
    );
};

interface EventProps {
    seriesId: string;
    eventId: string;
    vendorEventId: string;
    eventStatus: string;
    ingestEndpoint: string;
    streamKey: string;
    segment: number;
}

function Event({
    seriesId,
    eventId,
    vendorEventId,
    eventStatus,
    ingestEndpoint,
    streamKey,
    segment,
}: EventProps) {
    const [eventName, setEventName] = useState("");
    const [streamUrl, setStreamUrl] = useState("");
    const [eventStart, setEventStart] = useState(new Date());
    const [eventEnd, setEventEnd] = useState(new Date());
    const [duration, setDuration] = useState(60);
    const router = useRouter();
    const { serverCode } = router.query as { serverCode: string };
    const userRole = "admin";

    const handleModifySubmit = (values: any) => {
        setEventName(values.eventName);
        setStreamUrl(values.streamUrl);
        setEventStart(values.eventStart);
        setEventEnd(values.eventEnd);
        setDuration(values.duration);
    };

    const handleCreateSubmit = (values: any) => {
        setEventName(values.eventName);
        setStreamUrl(values.streamUrl);
        setEventStart(values.eventStart);
        setEventEnd(values.eventEnd);
        setDuration(values.duration);
    };

    const params = useParams();

    const handleEdit = () => {
        const editEventRouteUrl =
            WILDFILE_ROUTES.SERVER.EVENT_DASHBOARD.EVENT.EDIT.url;
        const formattedRouteUrl = formatRouteConfigUrl(editEventRouteUrl, {
            serverCode,
            eventId: vendorEventId,
        });
        router.push(formattedRouteUrl);
    };

    return (
        <EventLayout>
            <Flex flexDirection={"row"} justifyContent={"center"} pt={"2rem"}>
                <EventCard
                    seriesId={seriesId}
                    eventId={eventId.toString()}
                    vendorEventId={vendorEventId}
                    eventStatus={eventStatus}
                    ingestEndpoint={ingestEndpoint}
                    streamKey={streamKey}
                    segment={segment}
                    onEdit={handleEdit}
                    userRole={userRole}
                />
            </Flex>
        </EventLayout>
    );
}

export default Event;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const vendorEventId = context?.params?.id as string;

    try {
        //Get our IStreamRepository from the DI Container
        const streamRepository: IStreamRepository =
            diContainer.get("IStreamRepository");

        //Get our IEventService from the DI Container
        const beamableEventService: IEventService =
            diContainer.get("IEventService");

        //Get our IStageRepository from the DI Container
        const stageRepository: IStageRepository =
            diContainer.get("IStageRepository");

        await connectToDb();

        const wildcardAccessTokenCookie =
            getWildcardAccessTokenFromCookiesServerSide(context);

        // Authorize the user and check if they have the required role
        const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
            context
        );

        if (!userAuthorizedForPageResult.success) {
            // redirect the user if they are not authorized
            return userAuthorizedForPageResult.data as {
                redirect: { destination: string; permanent: boolean };
            };
        }

        // Redirect users to login page with encoded redirect URL if they are not logged in
        const redirectLoginResponse = redirectIfNotLoggedIn(context);
        if (redirectLoginResponse) {
            return redirectLoginResponse;
        }

        const authorizedUserData: AuthorizedUserData =
            userAuthorizedForPageResult.data as AuthorizedUserData;

        if (!authorizedUserData) {
            return {
                redirect: {
                    destination: "/login",
                    permanent: false,
                },
            };
        }

        const { userDB, serverDoc } = authorizedUserData;
        const redirect = redirectUserIfUnauthorized(
            wildcardAccessTokenCookie,
            userDB,
            context
        );

        if (redirect) {
            return redirect;
        }

        //TODO: Support multiple series per server
        //Get the first seriesId for this server
        if (serverDoc == null) {
            console.log("No server found!");
            return {
                props: {
                    seriesId: "",
                    eventId: "",
                    vendorEventId,
                    eventStatus: "",
                    ingestEndpoint: "",
                    streamKey: "",
                    segment: 0,
                },
            };
        }
        if (serverDoc?.series == null || serverDoc?.series.length < 1) {
            console.log("No series found!");
            return {
                props: {
                    seriesId: "",
                    eventId: "",
                    vendorEventId,
                    eventStatus: "",
                    ingestEndpoint: "",
                    streamKey: "",
                    segment: 0,
                },
            };
        }
        if (serverDoc?.series[0]._id == null) {
            console.log("No seriesId found!");
            return {
                props: {
                    seriesId: "",
                    eventId: "",
                    vendorEventId,
                    eventStatus: "",
                    ingestEndpoint: "",
                    streamKey: "",
                    segment: 0,
                },
            };
        }
        const seriesId = serverDoc?.series[0]._id.toString();

        //Get the streamId from the rule in the vendor event
        const streamId: string =
            await beamableEventService.getStreamIdFromVendorEventId(
                vendorEventId
            );

        //If we can't get a streamId, throw an error
        if (streamId == "") {
            console.log(
                "Failed to get streamId from vendor for vendorEventId: ",
                vendorEventId
            );
            return {
                props: {
                    seriesId: "",
                    eventId: "",
                    vendorEventId,
                    eventStatus: "",
                    ingestEndpoint: "",
                    streamKey: "",
                    segment: 0,
                },
            };
        }

        //Get the stream from the streamId.  We'll use this to get the eventId.
        const stream = await streamRepository.findStreamById(streamId);

        //If we can't get the stream, throw an error
        if (stream == null) {
            console.log("Failed to get stream for streamId: ", streamId);
            return {
                props: {
                    seriesId: "",
                    eventId: "",
                    vendorEventId,
                    eventStatus: "",
                    ingestEndpoint: "",
                    streamKey: "",
                    segment: 0,
                },
            };
        }

        //Get the stageId from the stream
        const stageId = stream.stageId;

        //Get the stage from the eventId
        const stage = await stageRepository.getStage(stageId.toString());

        if (stage == null) {
            console.log("Failed to get stage for eventId: ", stageId);
            return {
                props: {
                    seriesId: "",
                    eventId: "",
                    vendorEventId,
                    eventStatus: "",
                    ingestEndpoint: "",
                    streamKey: "",
                    segment: 0,
                },
            };
        }

        return {
            props: {
                seriesId,
                eventId: stageId.toString(),
                vendorEventId,
                eventStatus: stage.status ?? "",
                ingestEndpoint: stream.ingestEndpoint,
                streamKey: stream.streamKey,
                segment: stage.currentSegment,
            },
        };
    } catch (e) {
        console.log("Failed to get fetch event", e);
        return {
            props: {
                seriesId: "",
                eventId: "",
                vendorEventId,
                eventStatus: "",
                ingestEndpoint: "",
                streamKey: "",
                segment: 0,
            },
        };
    }
};
