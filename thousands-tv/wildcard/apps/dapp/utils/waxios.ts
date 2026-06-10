import axios from 'axios';
import { getClientSideCookieValue } from './sessionUtil';

const waxios = axios.create();

/**
 * Set the auth token in the request headers for all requests made with waxios.
 * Otherwise, same params/usage as axios
 */
waxios.interceptors.request.use((config) => {
    const authToken = getClientSideCookieValue('wildcardAccessToken');

    if (authToken) {
        config.headers.set('Content-Type', 'application/json');
        config.headers.set('Authorization', `Bearer ${authToken}`);
    }

    return config;
});

export default waxios;