// Offline VM execution only. Non-root auth is mocked explicitly for constructor
// registration. These tests do not prove wallet authorization or deploy security.
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{StellarAssetClient, TokenClient},
    Address, Env, String,
};
mod old_crowdfund {
    soroban_sdk::contractimport!(file = "../../../../backend/wasm/reviewed-crowdfund.wasm");
}
mod new_crowdfund {
    soroban_sdk::contractimport!(file = "../../../../backend/wasm/sdk30-crowdfund.wasm");
}
mod old_token {
    soroban_sdk::contractimport!(file = "../../../../backend/wasm/v2-share-token-sep41.wasm");
}
mod new_token {
    soroban_sdk::contractimport!(file = "../../../../backend/wasm/sdk30-share-token.wasm");
}
mod old_offering {
    soroban_sdk::contractimport!(file = "../../../../backend/wasm/v2-offering.wasm");
}
mod new_offering {
    soroban_sdk::contractimport!(file = "../../../../backend/wasm/sdk30-offering.wasm");
}

#[test]
fn old_and_sdk30_crowdfund_wasm_execute_success_and_refund_on_host30() {
    for wasm in [old_crowdfund::WASM, new_crowdfund::WASM] {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().set_timestamp(1000);
        let creator = Address::generate(&env);
        let alice = Address::generate(&env);
        let sac = env.register_stellar_asset_contract_v2(Address::generate(&env));
        StellarAssetClient::new(&env, &sac.address()).mint(&alice, &5000);
        let id = env.register(wasm, (&creator, &sac.address(), 1000i128, 10000u64));
        let client = new_crowdfund::Client::new(&env, &id);
        assert_eq!(client.get_config().goal, 1000);
        client.contribute(&alice, &300);
        assert_eq!(client.balance_of(&alice), 300);
        assert!(client.try_refund(&alice).is_err());
        env.ledger().set_timestamp(10000);
        assert_eq!(client.refund(&alice), 300);
        assert_eq!(TokenClient::new(&env, &sac.address()).balance(&alice), 5000);
        assert!(client.try_refund(&alice).is_err());
    }
}
#[test]
fn old_and_sdk30_share_token_wasm_execute_mint_transfer_and_burn_on_host30() {
    for wasm in [old_token::WASM, new_token::WASM] {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        let admin = Address::generate(&env);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);
        let id = env.register(
            wasm,
            (
                &admin,
                String::from_str(&env, "Compatibility"),
                String::from_str(&env, "CMP"),
                7u32,
            ),
        );
        let client = new_token::Client::new(&env, &id);
        assert!(client.try_mint(&alice, &10).is_err());
        client.set_minter(&admin);
        client.mint(&alice, &100);
        client.transfer(&alice, &bob, &40);
        assert_eq!(client.balance(&alice), 60);
        assert_eq!(client.balance(&bob), 40);
        client.burn(&bob, &10);
        assert_eq!(client.total_supply(), 90);
    }
}
#[test]
fn old_and_sdk30_offering_wasm_execute_limits_and_errors_on_host30() {
    for wasm in [old_offering::WASM, new_offering::WASM] {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().set_timestamp(1000);
        let admin = Address::generate(&env);
        let token = Address::generate(&env);
        let issuer = Address::generate(&env);
        let id = env.register(
            wasm,
            (
                &admin, &token, &issuer, 100i128, 5000i128, 50000i128, 10000u64,
            ),
        );
        let client = new_offering::Client::new(&env, &id);
        assert_eq!(client.get_config().token, token);
        client.check_investment_amount(&100);
        assert!(client.try_check_investment_amount(&99).is_err());
        assert!(client.try_check_investment_amount(&5001).is_err());
    }
}
