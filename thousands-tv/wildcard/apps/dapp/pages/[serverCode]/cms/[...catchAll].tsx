/**
 * Server-scoped CMS catch-all page for Plasmic content
 * Handles routes like /thousands/cms/about, /thousands/cms/news/latest-update, etc.
 * 
 * This allows each server to have its own CMS content while maintaining
 * the server code structure of your application
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

interface ServerCMSPageProps {
    plasmicData?: ComponentRenderData;
    queryCache?: Record<string, any>;
    serverCode: string;
}

/**
 * Fetch all CMS pages for all servers for static generation
 */
export const getStaticPaths: GetStaticPaths = async () => {
    try {
        if (!PLASMIC) {
            return {
                paths: [],
                fallback: 'blocking',
            };
        }

        // Define your server codes - you can make this dynamic later
        const serverCodes = ['thousands']; // Add more as needed

        // Fetch pages from Plasmic Studio
        const plasmicPages = await PLASMIC.fetchPages();

        console.log('Available Plasmic pages:', plasmicPages.map((p: any) => p.path));

        // Generate paths for each server code + CMS page combination
        const paths: Array<{ params: { serverCode: string; catchAll: string[] } }> = [];

        serverCodes.forEach(serverCode => {
            plasmicPages
                .filter((page: any) => {
                    // Filter pages that should be available as CMS content
                    return !page.path.startsWith('/admin') &&
                        !page.path.startsWith('/app') &&
                        page.path !== '/' &&
                        page.path !== '/Homepage';
                })
                .forEach((page: any) => {
                    const pathSegments = page.path.substring(1).split('/').filter(Boolean);
                    paths.push({
                        params: {
                            serverCode,
                            catchAll: pathSegments
                        }
                    });
                });
        });

        return {
            paths,
            fallback: 'blocking', // Generate other combinations on-demand
        };
    } catch (error) {
        console.error('Error fetching server CMS page paths:', error);
        return {
            paths: [],
            fallback: 'blocking',
        };
    }
};

/**
 * Pre-fetch the data needed to render each server CMS page
 */
export const getStaticProps: GetStaticProps<ServerCMSPageProps> = async (context) => {
    const { serverCode, catchAll } = context.params ?? {};

    console.log('CMS catchAll getStaticProps called with:', { serverCode, catchAll });

    if (!PLASMIC) {
        console.log('PLASMIC not initialized');
        return {
            notFound: true,
        };
    }

    // Convert the catchAll param into a path string
    const plasmicPath =
        typeof catchAll === 'string'
            ? `/${catchAll}`
            : Array.isArray(catchAll)
                ? `/${catchAll.join('/')}`
                : '/';

    console.log('Attempting to fetch Plasmic path:', plasmicPath);

    try {
        // Try to fetch from Plasmic Studio
        const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);

        console.log('Plasmic fetch result:', plasmicData ? 'found' : 'not found');
        if (plasmicData) {
            console.log('Entry components:', plasmicData.entryCompMetas?.map((c: any) => c.displayName));
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

        // Page not found in Plasmic
        return {
            notFound: true,
        };
    } catch (error) {
        console.error('Error fetching server CMS page data:', error);
        return {
            notFound: true,
        };
    }
};

/**
 * Render the server-scoped CMS page from Plasmic
 */
export default function ServerCMSPage({ plasmicData, queryCache, serverCode }: ServerCMSPageProps) {
    const router = useRouter();

    console.log('Rendering ServerCMSPage for serverCode:', serverCode, 'router.query:', router.query);
    // Handle Plasmic Studio pages
    if (plasmicData && plasmicData.entryCompMetas.length > 0) {
        const pageMeta = plasmicData.entryCompMetas[0];
        console.log('Rendering CMS page for server:', serverCode, plasmicData)
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
