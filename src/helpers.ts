
export function truncateDbName(name: string, maxLength: number) {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength - 3)}...`;
}


export const DEFAULT_ENDPOINT = "fireproof://cloud.fireproof.direct?getBaseUrl=https://storage.fireproof.direct/";
export const SYNC_DB_NAME = "fp_sync";