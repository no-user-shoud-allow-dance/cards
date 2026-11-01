/**
 * The local, serverless profile ("account") of this device. No email, no
 * password, no server — just a locally generated identity. The UUID is the
 * account identifier and the seed of the identicon avatar; rotating it
 * starts a fresh identity ("this ID leaked" response).
 */
export interface Profile {
    /** User-defined display name, e.g. "Noah". */
    name: string;
    /** User-defined device name, to tell devices apart. */
    deviceName: string;
    createdAt: number;
    /** Account UUID — rotatable via syncStore.rotateUuid(). */
    uuid: string;
}
