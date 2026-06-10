import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Cookies from "cookies";
import {
    ComponentRenderData,
    PlasmicComponent,
    PlasmicRootProvider,
    extractPlasmicQueryData,
} from "@plasmicapp/loader-nextjs";
import {
    isLoggedOutCmsRedirectEnabled,
} from "../utils/environmentUtilWCA";
import {
    AuthorizedUserData,
    authorizeUser,
} from "@/utils/backend/sessionServerUtil";
import { getExistingServerCodeFromCookie } from "@/utils/backend/accountsBackendUtil";
import { middleware } from "@/middleware";
import { PLASMIC } from "@/lib/plasmic-init";

const PLASMIC_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface MarketingProps {
    plasmicData: ComponentRenderData;
    queryCache?: Record<string, unknown>;
}

interface PlasmicCacheEntry {
    data: ComponentRenderData;
    queryCache?: Record<string, unknown>;
    timestamp: number;
}

// Simple in-memory cache so we don't fetch Homepage from Plasmic on every request
let cachedHomepage: PlasmicCacheEntry | null = null;

export default function MarketingLanding({
    plasmicData,
    queryCache,
}: MarketingProps) {
    const router = useRouter();
    const compMeta = plasmicData.entryCompMetas[0];

    return (
        <PlasmicRootProvider
            loader={PLASMIC}
            prefetchedData={plasmicData}
            prefetchedQueryData={queryCache}
            pageRoute={compMeta.path}
            pageParams={compMeta.params}
            pageQuery={router.query}
        >
            <PlasmicComponent component={compMeta.displayName} />
        </PlasmicRootProvider>
    );
}

export const getServerSideProps: GetServerSideProps<MarketingProps> = async (
    context
) => {
    const authorizedUserData: AuthorizedUserData | null = await authorizeUser(
        context
    );

    if (authorizedUserData?.userDB) {
        const cookies = new Cookies(context.req, context.res);
        const existingServerCode = getExistingServerCodeFromCookie(cookies);

        if (existingServerCode) {
            const destination = existingServerCode.startsWith('/')
                ? existingServerCode
                : `/${existingServerCode}`;
                
            return {
                redirect: {
                    destination,
                    permanent: false,
                },
            };
        }
    }

    if (!isLoggedOutCmsRedirectEnabled())
    {
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    if (!PLASMIC) {
        console.error(
            "Plasmic loader not configured; returning 404 for root marketing page."
        );
        return { notFound: true };
    }

    const now = Date.now();
    const cacheIsStale =
        !cachedHomepage || now - cachedHomepage.timestamp > PLASMIC_CACHE_TTL_MS;

    if (cacheIsStale) {
        const plasmicData = await PLASMIC.fetchComponentData("Homepage");

        if (!plasmicData) {
            throw new Error("No Plasmic design found for Homepage");
        }

        const compMeta = plasmicData.entryCompMetas[0];
        const queryCache = await extractPlasmicQueryData(
            <PlasmicRootProvider
                loader={PLASMIC}
                prefetchedData={plasmicData}
                pageRoute={compMeta.path}
                pageParams={compMeta.params}
            >
                <PlasmicComponent component={compMeta.displayName} />
            </PlasmicRootProvider>
        );

        cachedHomepage = {
            data: plasmicData,
            queryCache,
            timestamp: now,
        };
    }

    //This should normally be unreachable, but if for some reason cachedHomepage is null at this point then we will just redirect the user to the login page
    if (cachedHomepage == null)
    {
        return {
                redirect: {
                    destination: "/login",
                    permanent: false,
                },
            };
    }

    return {
        props: {
            plasmicData: cachedHomepage.data,
            queryCache: cachedHomepage.queryCache,
        },
    };
};

export { middleware };
