import Metrics from "@/features/Metrics";
import ThousandsLayout from "@/layouts/ThousandsLayout";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import { IUser } from "@repo/interfaces";
import { GetServerSideProps } from "next";

// export async function getServerSideProps() {
//     const filePath = path.join(
//         process.cwd(),
//         "pages/[serverCode]/metrics/20250821matchdata.txt"
//     );
//     console.log("filepath", filePath);
//     const fileContent = fs.readFileSync(filePath, "utf-8");
//     const data = JSON.parse(fileContent);

//     return { props: { data } };
// }

interface MetricsPageProps {
    userDBStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
}

const MetricsPage = ({
    userDBStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
}: MetricsPageProps) => {
    const userDB = userDBStr ? JSON.parse(userDBStr) : null;

    return (
        <ThousandsLayout
            userDB={userDB}
            connectedUserDBProviderId={connectedUserDBProviderId}
            connectedUserDBEmail={connectedUserDBEmail}
        >
            <Metrics />
        </ThousandsLayout>
    );
};

export const getServerSideProps: GetServerSideProps<
    MetricsPageProps | { redirect: { destination: string; permanent: boolean } }
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
        return {
            props: {
                userDBStr: JSON.stringify(userDB),
                connectedUserDBEmail: connectedUserDBEmail ?? "",
                connectedUserDBProviderId: connectedUserDBProviderId ?? "",
            },
        };
    } catch (e) {
        const errMsg = "Failed to fetch metrics";
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

export default MetricsPage;
