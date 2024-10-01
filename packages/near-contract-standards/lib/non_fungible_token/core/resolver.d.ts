import { AccountId } from "near-sdk-js";
import { TokenId } from "../token";
/** Used when an NFT is transferred using `nft_transfer_call`. This is the method that's called after `nft_on_transfer`. This interface is implemented on the NFT contract.
 *
 * # Examples
 *
 * ```typescript

 * import { AccountId } from "near-sdk-js";
 * import { TokenId } from "../token";
 * import { NonFungibleTokenCore, NonFungibleToken, NonFungibleTokenResolver } from "near-contract-standards/lib"
 *
 * @NearBindgen({ requireInit: false })
 * export class Contract implements NonFungibleTokenCore, NonFungibleTokenResolver {
 *     private token: NonFungibleToken;
 *
 *     constructor() {
 *         this.tokens = new NonFungibleToken();
 *     }
 *
 *     @call({})
 *     nft_resolve_transfer({ previous_owner_id, receiver_id, token_id, approved_account_ids, }: {
            previous_owner_id: AccountId;
            receiver_id: AccountId;
            token_id: TokenId;
            approved_account_ids?: {
                [approval: AccountId]: bigint;
            };
    }): boolean; {
        return this.tokens.nft_resolve_transfer({
            previous_owner_id,
            receiver_id,
            token_id,
            approved_account_ids,
            });
        }
 * }
 * ```
*/
export interface NonFungibleTokenResolver {
    /** Finalize an `nft_transfer_call` chain of cross-contract calls.
     *
     * The `nft_transfer_call` process:
     *
     * 1. Sender calls `nft_transfer_call` on FT contract
     * 2. NFT contract transfers token from sender to receiver
     * 3. NFT contract calls `nft_on_transfer` on receiver contract
     * 4+. [receiver contract may make other cross-contract calls]
     * N. NFT contract resolves promise chain with `nft_resolve_transfer`, and may
     *    transfer token back to sender
     *
     * Requirements:
     * - Contract MUST forbid calls to this function by any account except self
     * - If promise chain failed, contract MUST revert token transfer
     * - If promise chain resolves with `true`, contract MUST return token to
     *   `sender_id`
     *
     * @param previous_owner_id - The owner prior to the call to `nft_transfer_call`
     * @param receiver_id - The `receiver_id` argument given to `nft_transfer_call`
     * @param token_id - The `token_id` argument given to `ft_transfer_call`
     * @param approved_account_ids - If using Approval Management, contract MUST provide
     *        set of original approved accounts in this argument, and restore these
     *        approved accounts in case of revert.
     *
     * @returns true if token was successfully transferred to `receiver_id`.
     */
    nft_resolve_transfer({ previous_owner_id, receiver_id, token_id, approved_account_ids, }: {
        previous_owner_id: AccountId;
        receiver_id: AccountId;
        token_id: TokenId;
        approved_account_ids?: {
            [approval: AccountId]: bigint;
        };
    }): boolean;
}
