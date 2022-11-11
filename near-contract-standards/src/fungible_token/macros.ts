/// The core methods for a basic fungible token. Extension standards may be
/// added in addition to this macro.
#[macro_export]
macro_rules! impl_fungible_token_core {
    ($contract: ident, $token: ident $(, $on_tokens_burned_fn:ident)?) => {
        use $crate::fungible_token::core::FungibleTokenCore;
        use $crate::fungible_token::resolver::FungibleTokenResolver;

        #[near_bindgen]
        impl FungibleTokenCore for $contract {
            #[payable]
            ft_transfer(
                &mut self,
                receiver_id: AccountId,
                amount: number,
                memo: Option<String>,
            ) {
                self.$token.ft_transfer(receiver_id, amount, memo)
            }

            #[payable]
            ft_transfer_call(
                &mut self,
                receiver_id: AccountId,
                amount: number,
                memo: Option<String>,
                msg: String,
            ) -> PromiseOrValue<number> {
                self.$token.ft_transfer_call(receiver_id, amount, memo, msg)
            }

            ft_total_supply(&self) -> number {
                self.$token.ft_total_supply()
            }

            ft_balance_of(&self, account_id: AccountId) -> number {
                self.$token.ft_balance_of(account_id)
            }
        }

        #[near_bindgen]
        impl FungibleTokenResolver for $contract {
            #[private]
            ft_resolve_transfer(
                &mut self,
                sender_id: AccountId,
                receiver_id: AccountId,
                amount: number,
            ) -> number {
                let (used_amount, burned_amount) =
                    self.$token.internal_ft_resolve_transfer(&sender_id, receiver_id, amount);
                if burned_amount > 0 {
                    $(self.$on_tokens_burned_fn(sender_id, burned_amount);)?
                }
                used_amount.into()
            }
        }
    };
}

/// Ensures that when fungible token storage grows by collections adding entries,
/// the storage is be paid by the caller. This ensures that storage cannot grow to a point
/// that the FT contract runs out of Ⓝ.
/// Takes name of the Contract struct, the inner field for the token and optional method name to
/// call when the account was closed.
#[macro_export]
macro_rules! impl_fungible_token_storage {
    ($contract: ident, $token: ident $(, $on_account_closed_fn:ident)?) => {
        use $crate::storage_management::{
            StorageManagement, StorageBalance, StorageBalanceBounds
        };

        #[near_bindgen]
        impl StorageManagement for $contract {
            #[payable]
            storage_deposit(
                &mut self,
                account_id: Option<AccountId>,
                registration_only: Option<bool>,
            ) -> StorageBalance {
                self.$token.storage_deposit(account_id, registration_only)
            }

            #[payable]
            storage_withdraw(amount: Option<number>) -> StorageBalance {
                self.$token.storage_withdraw(amount)
            }

            #[payable]
            storage_unregister(force: Option<bool>) -> bool {
                #[allow(unused_variables)]
                if let Some((account_id, balance)) = self.$token.internal_storage_unregister(force) {
                    $(self.$on_account_closed_fn(account_id, balance);)?
                    true
                } else {
                    false
                }
            }

            storage_balance_bounds(&self) -> StorageBalanceBounds {
                self.$token.storage_balance_bounds()
            }

            storage_balance_of(&self, account_id: AccountId) -> Option<StorageBalance> {
                self.$token.storage_balance_of(account_id)
            }
        }
    };
}
