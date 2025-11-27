import { type Comment } from './commentObject';
import { type ReputationProof } from './object';
/**
 * Gets the timestamp of a block given its block ID.
 * @param blockId The ID of the block.
 * @returns The block timestamp (in milliseconds).
 */
export declare function getTimestampFromBlockId(blockId: string): Promise<number>;
/**
 * Searches the blockchain for all spam alerts targeting a comment.
 */
export declare function fetchSpan(comment_id: string): Promise<number>;
/**
 * Searches the blockchain for all top-level comments (threads)
 * for a given discussion (project).
 */
export declare function fetchComments(discussion: string, reply?: boolean): Promise<Comment[]>;
/**
 * Fetches the full ReputationProof object for the connected user,
 * by searching all boxes where R7 matches their wallet address.
 * @param ergo The connected wallet object (e.g., dApp Connector)
 */
export declare function fetchProfile(ergo: any): Promise<ReputationProof | null>;
