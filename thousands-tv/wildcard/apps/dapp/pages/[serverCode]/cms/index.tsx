/**
 * CMS index page - renders Plasmic root page (/)
 * This handles the route /[serverCode]/cms/ and maps to Plasmic's root page
 */

import React from 'react';
import {
    PlasmicComponent,
    ComponentRenderData,
    PlasmicRootProvider,
    extractPlasmicQueryData,
} from '@plasmicapp/loader-nextjs';
import { GetStaticPaths, GetStaticProps } from 'next';
import Error from 'next/error';
import { useRouter } from 'next/router';
import { PLASMIC } from '../../../lib/plasmic-init';

interface CMSIndexPageProps {
    plasmicData?: ComponentRenderData;
    queryCache?: Record<string, any>;
    serverCode: string;
}

/**
 * Generate static paths for all server codes
 */
export const getStaticPaths: GetStaticPaths = async () => {
    // Define your server codes - you can make this dynamic later
    const serverCodes = ['thousands']; // Add more as needed

    const paths = serverCodes.map(serverCode => ({
        params: { serverCode }
    }));

    return {
        paths,
        fallback: 'blocking', // Generate other server codes on-demand
    };
};

/**
 * Fetch the Plasmic root page (/) data
 */
export const getStaticProps: GetStaticProps<CMSIndexPageProps> = async (context) => {
    const { serverCode } = context.params ?? {};

    console.log('CMS index getStaticProps called for server:', serverCode);

    if (!PLASMIC) {
        return {
            notFound: true,
        };
    }

    try {
        // Fetch the root page from Plasmic
        const plasmicData = await PLASMIC.maybeFetchComponentData('/');
        
        console.log('Plasmic root page fetch result:', plasmicData ? 'found' : 'not found');
        if (plasmicData) {
            console.log('Root page component:', plasmicData.entryCompMetas?.map((c: any) => c.displayName));
        }

        if (plasmicData && plasmicData.entryCompMetas.length > 0) {
            const pageMeta = plasmicData.entryCompMetas[0];

            // Cache the necessary data fetched for the page
            const queryCache = await extractPlasmicQueryData(
                <PlasmicRootProvider
                    loader={PLASMIC}
                    prefetchedData={plasmicData}
                    pageRoute={pageMeta.path ? pageMeta.path.replace('[serverCode]', serverCode as string) : pageMeta.path}
                    pageParams={{
                        ...pageMeta.params,
                        serverCode: serverCode as string
                    }}
                >
                    <PlasmicComponent 
                        component={pageMeta.displayName}
                        componentProps={{
                            serverCode: serverCode as string
                        }}
                    />
                </PlasmicRootProvider>
            );

            return {
                props: { 
                    plasmicData, 
                    queryCache,
                    serverCode: serverCode as string
                },
                revalidate: 300, // Revalidate every 5 minutes
            };
        }

        // Root page not found in Plasmic
        return {
            notFound: true,
        };
    } catch (error) {
        console.error('Error fetching CMS root page data:', error);
        return {
            notFound: true,
        };
    }
};

/**
 * Render the CMS root page from Plasmic
 */
export default function CMSIndexPage({ plasmicData, queryCache, serverCode }: CMSIndexPageProps) {
    const router = useRouter();

    // Handle Plasmic Studio pages
    if (plasmicData && plasmicData.entryCompMetas.length > 0) {
        const pageMeta = plasmicData.entryCompMetas[0];
        return (
            <PlasmicRootProvider
                loader={PLASMIC}
                prefetchedData={plasmicData}
                prefetchedQueryData={queryCache}
                pageRoute={pageMeta.path ? pageMeta.path.replace('[serverCode]', serverCode) : pageMeta.path} // Replace dynamic param with actual value
                pageParams={{
                    ...pageMeta.params,
                    serverCode: serverCode // Pass the actual server code
                }}
                pageQuery={{
                    ...router.query,
                    serverCode: serverCode // Also add to query for consistency
                }}
            >
                <PlasmicComponent 
                    component={pageMeta.displayName}
                    componentProps={{
                        serverCode: serverCode // Pass server code as a component prop
                    }}
                />
            </PlasmicRootProvider>
        );
    }

    // Page not found
    return <Error statusCode={404} />;
}
