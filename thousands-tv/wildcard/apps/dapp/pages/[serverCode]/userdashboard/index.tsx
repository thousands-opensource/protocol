import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import connectToDb from "@/db/connectToDb";
import Notifications from "@/features/Notifications";
import UserDashboard from "@/features/UserDashboard";
import ThousandsLayout from "@/layouts/ThousandsLayout";
import { useBuyCreditsStore } from "@/store/useBuyCreditsStore";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import {
    getUserDBSessionObj,
    redirectUserIfUnauthorized,
} from "@/utils/sessionUtil";
import { IUser } from "@repo/interfaces";
import { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

interface UserDashboardPageProps {
    userDBStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
}

const UserDashboardPage = ({
    userDBStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
}: UserDashboardPageProps) => {
    // const { data: session } = useSession();
    // const userDB = getUserDBSessionObj(session);
    const { setBuyCreditsPopupOpen } = useBuyCreditsStore();
    const { setUserDB, setConnectedUserDBProviderId, setConnectedUserDBEmail } =
        useWildfileUserContext();
    const router = useRouter();

    let userDBParsed = null;

    if (userDBStr) {
        userDBParsed = JSON.parse(userDBStr);
    }

    useEffect(() => {
        if (router.query.action === "creditsPurchase") {
            setBuyCreditsPopupOpen(true);
        }

        setUserDB(userDBParsed);
        setConnectedUserDBProviderId(connectedUserDBProviderId);
        setConnectedUserDBEmail(connectedUserDBEmail);
    }, []);

    return <UserDashboard />;
};

export const getServerSideProps: GetServerSideProps<
    | UserDashboardPageProps
    | { redirect: { destination: string; permanent: boolean } }
> = async (context) => {
    const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
        context
    );

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
        await connectToDb();

        return {
            props: {
                userDBStr: JSON.stringify(userDB),
                connectedUserDBEmail: connectedUserDBEmail ?? "",
                connectedUserDBProviderId: connectedUserDBProviderId ?? "",
            },
        };
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

export default UserDashboardPage;
