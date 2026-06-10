import {
    PlasmicRootProvider,
    PlasmicComponent,
    ComponentRenderData,
    extractPlasmicQueryData
} from '@plasmicapp/loader-nextjs';
import { useRouter } from 'next/router';
import { GetStaticProps, GetStaticPaths } from 'next';
import { PLASMIC } from '../../../lib/plasmic-init';

export default function MarketingLandingPage(props: { plasmicData: ComponentRenderData; queryCache?: Record<string, any> }) {
    const router = useRouter();
    const compMeta = props.plasmicData.entryCompMetas[0];
    return (
        <PlasmicRootProvider
            loader={PLASMIC}
            prefetchedData={props.plasmicData}
            prefetchedQueryData={props.queryCache}
            pageRoute={compMeta.path}
            pageParams={compMeta.params}
            pageQuery={router.query}
        >
            <PlasmicComponent component={compMeta.displayName} />
        </PlasmicRootProvider>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    const paths = [
        { params: { serverCode: 'thousands' } }, // supposedly prebuilding makes this faster, but other clients will still get generated on demand. has to do with static page generation.
    ];

    return {
        paths,
        fallback: 'blocking'
    };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    if (!PLASMIC) {
        console.error('Plasmic loader not configured; returning 404 for marketing landing page.');
        return { notFound: true };
    }

    const plasmicData = await PLASMIC.fetchComponentData('Homepage');
    if (!plasmicData) {
        throw new Error('No Plasmic design found');
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
    return {
        props: {
            plasmicData,
            queryCache
        },
        revalidate: 300
    };
};
