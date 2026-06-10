import connectToDb from "@/db/connectToDb";
import PredictionDetail from "@/features/Predictions/PredictionDetail";
import ThousandsLayout from "@/layouts/ThousandsLayout";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import { IUser, IRallyPrediction } from "@repo/interfaces";
import { GetServerSideProps } from "next";
import { diContainer } from "@/inversify.config";
import IRallyPredictionRepository from "@/repositories/interfaces/IRallyPredictionRepository";
import { useMemo } from "react";

interface PredictionDetailPageProps {
    userDBStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
    rallyPredictionStr: string;
    sharedDataStr?: string;
}

const PredictionDetailPage = ({
    userDBStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    rallyPredictionStr,
    sharedDataStr
}: PredictionDetailPageProps) => {
    const userDB = userDBStr ? JSON.parse(userDBStr) : null;
    const sharedData = sharedDataStr ? JSON.parse(sharedDataStr) : null;
    const rallyPrediction: IRallyPrediction = useMemo(() => {
        const x = rallyPredictionStr
        ? JSON.parse(rallyPredictionStr)
        : null;
        if (x) {
            x.startDate = new Date(x.startDate);
            x.endDate = new Date(x.endDate);
            x.createdAt = new Date(x.createdAt);
            x.updatedAt = new Date(x.updatedAt);
        }
        return x;
    }, [rallyPredictionStr]);

    if (!rallyPrediction) {
        return (
            <ThousandsLayout
                userDB={userDB}
                connectedUserDBProviderId={connectedUserDBProviderId}
                connectedUserDBEmail={connectedUserDBEmail}
            >
                <div style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "white"
                }}>
                    <h1>Forecast Not Found</h1>
                    <p>The forecast you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                </div>
            </ThousandsLayout>
        );
    }

    return (
        <ThousandsLayout
            userDB={userDB}
            connectedUserDBProviderId={connectedUserDBProviderId}
            connectedUserDBEmail={connectedUserDBEmail}
        >
            <PredictionDetail rallyPrediction={rallyPrediction} sharedData={sharedData} />
        </ThousandsLayout>
    );
};

export default PredictionDetailPage;

export const getServerSideProps: GetServerSideProps<
    | PredictionDetailPageProps
    | { redirect: { destination: string; permanent: boolean } }
> = async (context) => {
    const totalStartTime = Date.now();
    console.log("[PERF] Forecasts Detail getServerSideProps - START");

    const authCheckStart = Date.now();
    const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
        context
    );
    console.log(`[PERF] checkUserAuthorizedForPage took: ${Date.now() - authCheckStart}ms`);

    if (!userAuthorizedForPageResult.success) {
        // redirect the user if they are not authorized
        return userAuthorizedForPageResult.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    const authorizedUserData: AuthorizedUserData =
        userAuthorizedForPageResult.data as AuthorizedUserData;
    const userDB: IUser | null = authorizedUserData?.userDB;

    const {
        wildcardAccessToken,
        serverDoc,
        connectedUserDBEmail,
        connectedUserDBProviderId,
    } = authorizedUserData;
    const serverDocCode = serverDoc?.serverCode || "";

    const redirect = redirectUserIfUnauthorized(
        wildcardAccessToken,
        userDB,
        context
    );

    if (redirect) {
        return redirect;
    }

    try {
        const dbConnectStart = Date.now();
        await connectToDb();
        console.log(`[PERF] connectToDb took: ${Date.now() - dbConnectStart}ms`);

        // Get predictionId from query params
        const { predictionId } = context.params || {};

        if (!predictionId || typeof predictionId !== 'string') {
            // Redirect to predictions list if no valid ID
            return {
                redirect: {
                    destination: `/${serverDocCode}/forecasts`,
                    permanent: false,
                },
            };
        }

        // Fetch the rally prediction by ID with shared cache data
        const rallyPredictionRepository = diContainer.get<IRallyPredictionRepository>(
            "IRallyPredictionRepository"
        );

        const predictionQueryStart = Date.now();
        const predictionWithSharedData = await rallyPredictionRepository.getRallyPredictionByIdWithSharedData(
            predictionId
        );
        console.log(`[PERF] getRallyPredictionByIdWithSharedData took: ${Date.now() - predictionQueryStart}ms`);

        if (!predictionWithSharedData?.rallyPrediction) {
            // Redirect to predictions list if prediction not found
            return {
                redirect: {
                    destination: `/${serverDocCode}/forecasts`,
                    permanent: false,
                },
            };
        }

        const rallyPrediction = predictionWithSharedData.rallyPrediction;
        const sharedData = predictionWithSharedData.sharedData;

        // Check if the prediction is hidden
        const predictionObj = rallyPrediction.toObject() as IRallyPrediction;
        if (predictionObj.isVisible === false) {
            // For hidden predictions, show not found/unauthorized
            return {
                redirect: {
                    destination: `/${serverDocCode}/forecasts`,
                    permanent: false,
                },
            };
        }

        console.log('sharedData:', sharedData);
        const props = {
            props: {
                userDBStr: JSON.stringify(userDB),
                connectedUserDBEmail: connectedUserDBEmail ?? "",
                connectedUserDBProviderId: connectedUserDBProviderId ?? "",
                rallyPredictionStr: JSON.stringify(predictionObj),
                sharedDataStr: JSON.stringify(sharedData ?? {}),
            },
        };

        console.log(`[PERF] Forecasts Detail getServerSideProps - TOTAL: ${Date.now() - totalStartTime}ms`);
        return props;
    } catch (e) {
        const errMsg = "Failed to fetch forecast details";
        console.error(errMsg, e);

        // Redirect to predictions list on error
        return {
            redirect: {
                destination: `/${serverDocCode}/forecasts`,
                permanent: false,
            },
        };
    }
};