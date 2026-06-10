import { useState, useEffect } from "react";

/**
 * Wagmi Optimization - wait until it hits the browser and can check for `isMetamask`
 * @returns boolean - component is mounted to display the name for the InjectedConnector.
 */

//Reference: https://github.com/wagmi-dev/wagmi/issues/28
export const useIsMounted = () => {
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => setMounted(true), []);
    return mounted;
};
