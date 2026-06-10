import connectToDb from "@/db/connectToDb";
import Predictions from "@/features/Predictions";
import ThousandsLayout from "@/layouts/ThousandsLayout";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import { IUser } from "@repo/interfaces";
import { GetServerSideProps } from "next";

interface PredictionPageProps {
    userDBStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
}

const PredictionPage = ({
    userDBStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
}: PredictionPageProps) => {
    const userDB = userDBStr ? JSON.parse(userDBStr) : null;
    
    return (
        <ThousandsLayout
            userDB={userDB}
            connectedUserDBProviderId={connectedUserDBProviderId}
            connectedUserDBEmail={connectedUserDBEmail}
        >
            <Predictions />
        </ThousandsLayout>
    );
};

export default PredictionPage;

export const getServerSideProps: GetServerSideProps<
    | PredictionPageProps
    | { redirect: { destination: string; permanent: boolean } }
> = async (context) => {
    const totalStartTime = Date.now();
    console.log("[PERF] Forecasts List getServerSideProps - START");
    
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
        connectedUserDBEmail,
        connectedUserDBProviderId,
    } = authorizedUserData;

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

        const props = {
            props: {
                userDBStr: JSON.stringify(userDB),
                connectedUserDBEmail: connectedUserDBEmail ?? "",
                connectedUserDBProviderId: connectedUserDBProviderId ?? "",
            },
        };
        
        console.log(`[PERF] Forecasts List getServerSideProps - TOTAL: ${Date.now() - totalStartTime}ms`);
        return props;
    } catch (e) {
        const errMsg = "Failed to fetch user dashboard";
        console.error(errMsg, e);
        return {
            props: {
                userDBStr: "",
                connectedUserDBEmail: "",
                connectedUserDBProviderId: "",
            },
        };
    }
};
