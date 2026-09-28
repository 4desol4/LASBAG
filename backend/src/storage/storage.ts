/** Swap this implementation for S3/R2/Azure later without touching document business logic. */
export interface StorageService { put(input: { data: Buffer }): Promise<{ data: Buffer }>; }
/** MVP provider: bytes go into DocumentVersion.fileData (PostgreSQL BYTEA) inside the caller's transaction. */
export const postgresStorage: StorageService = { put: async ({ data }) => ({ data }) };
export const storage: StorageService = postgresStorage;
