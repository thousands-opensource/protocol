import { IUser } from "@src/db/interfaces/user";

/**
 * User Session Authenticate Interface Response (anti-fraud service)
 */
export interface SessionNetwork {
    ip_address: string;
    service_provider: string;
    connection_type: string;
}

export interface SessionLocation {
    continent: string;
    country_code: string;
    state: string;
    city: string;
    zip_code: string;
    timezone: string;
    latitude: number;
    longitude: number;
}

export interface SessionBrowser {
    type: string;
    version: string;
    language: string;
    user_agent: string;
    timezone: string;
}

export interface SessionDevice {
    category: string;
    type: string;
    os: string;
    cpu_cores: number;
    memory: number;
    gpu: string;
    screen_height: number;
    screen_width: number;
}

export interface SessionBotMetrics {
    mouse_num_events: number;
    click_num_events: number;
    keyboard_num_events: number;
    touch_num_events: number;
    clipboard_num_events: number;
}

export interface SessionRiskSignals {
    device_risk: boolean;
    proxy: boolean;
    vpn: boolean;
    tor: boolean;
    spoofed_ip: boolean;
    datacenter: boolean;
    recent_fraud_ip: boolean;
    impossible_travel: boolean;
    device_network_mismatch: boolean;
}

export interface SessionRiskSignalScores {
    device_risk: number;
    proxy: number;
    vpn: number;
    tor: number;
    datacenter: number;
    recent_fraud_ip: number;
    impossible_travel: number;
    device_network_mismatch: number;
}

export interface Session {
    start_time: string;
    true_country_code: string;
    network: SessionNetwork;
    location: SessionLocation;
    browser: SessionBrowser;
    device: SessionDevice;
    bot: SessionBotMetrics;
    risk_signals: SessionRiskSignals;
    risk_signal_scores: SessionRiskSignalScores;
}

export interface AccountData {
    id: string;
    email: string;
    metadata: Record<string, any>;
}

export interface UniqueMetrics {
    "1_day": number;
    "7_day": number;
}

export interface EmailData {
    email: string;
    disposable: boolean | null;
    personal: boolean | null;
    valid: boolean | null;
}

export interface AccountInfo {
    account: AccountData;
    num_sessions: number;
    first_seen: string;
    last_seen: string;
    last_session: string;
    country: string;
    countries: string[];
    unique_devices: UniqueMetrics;
    unique_networks: UniqueMetrics;
    email: EmailData;
    risk_signal_average: SessionRiskSignalScores;
}

export interface SessionAuthenticationResponse {
    project_id: string;
    session_id: string;
    account_id: string;
    request_id: string;
    decision: string;
    account_score: number;
    bot: number;
    multiple_accounts: number;
    risk_signals: number;
    accounts_linked: number;
    lists: any[];
    session: Session;
    account: AccountInfo;
}

/**
 * User Session Interface
 * @dev - This interface is used to store user session data, including authentication information and anti-fraud detection results.
 */
export interface UserSession {
    user: IUser; // The user object
    antiFraudDetection: SessionAuthenticationResponse | null; // anti-fraud detection data can be null if not available
    allow: boolean; // decision defined by the anti-fraud detection system
    timestamp: number; // timestamp of the last update stored in the cache
}
