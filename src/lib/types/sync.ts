/**
 * The local, serverless profile ("account") of this device. No email, no
 * password, no server — just a locally generated identity.
 */
export interface Profile {
    createdAt: number;
    /** Account UUID — rotatable via syncStore.rotateUuid(). */
    uuid: string;
}
