import VideoBroadcast from "./VideoBroadcast/index";
import Body from "../Stream/Body";
import WildfileNavigation from "../Wildfile/WildFileProfile/WildfileNavigation";
import { THOUSANDS_SERIES_NAME } from "@/types";
import Footer from "../Stream/Footer";

interface RealTimeStreamProps {
    streamBroadcastToken: string;
}

const RealTimeStream = ({ streamBroadcastToken }: RealTimeStreamProps) => {
    const videoBroadcastProps = {
        streamBroadcastToken,
    };

    return (
        <>
            <WildfileNavigation
                thousandsSeriesName={THOUSANDS_SERIES_NAME.ALPHA_SERIES}
                isSquareCorner={true}
            />
            <Body collectibles={[]}>
                <VideoBroadcast {...videoBroadcastProps} />
            </Body>
            <Footer />
        </>
    );
};
export default RealTimeStream;
