import Notifications from "@/features/Notifications";
import { getUserDBSessionObj } from "@/utils/sessionUtil";
import { useSession } from "next-auth/react";

interface NotificationsPageProps {}

const NotificationsPage = ({}: NotificationsPageProps) => {
    const { data: session } = useSession();
    const userDB = getUserDBSessionObj(session);

    return <Notifications userDB={userDB} />;
};

export default NotificationsPage;
