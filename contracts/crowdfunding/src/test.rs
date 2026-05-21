#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{StellarAssetClient, TokenClient},
    Address, Env, String,
};

use crate::contract::{Crowdfunding, CrowdfundingClient, Error, Status};

const STROOPS_PER_XLM: i128 = 10_000_000;
const BASE_TIMESTAMP: u64 = 1_700_000_000;

struct Setup<'a> {
    env: Env,
    admin: Address,
    contract: Address,
    client: CrowdfundingClient<'a>,
    token: Address,
    token_client: TokenClient<'a>,
    token_admin: StellarAssetClient<'a>,
    goal: i128,
    deadline: u64,
}

fn fresh_env() -> Env {
    let env = Env::default();
    env.ledger().with_mut(|li| {
        li.timestamp = BASE_TIMESTAMP;
    });
    env
}

fn setup_with_goal_and_deadline(goal_xlm: i128, deadline_offset: u64) -> Setup<'static> {
    let env = fresh_env();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_issuer = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_issuer);
    let token = token_contract.address();
    let token_admin = StellarAssetClient::new(&env, &token);
    let token_client = TokenClient::new(&env, &token);

    let contract = env.register(Crowdfunding, ());
    let client = CrowdfundingClient::new(&env, &contract);

    let goal = goal_xlm * STROOPS_PER_XLM;
    let deadline = env.ledger().timestamp() + deadline_offset;

    let name = String::from_str(&env, "Stellar Campus Vaca");
    client.initialize(&admin, &name, &goal, &deadline, &token);

    Setup {
        env,
        admin,
        contract,
        client,
        token,
        token_client,
        token_admin,
        goal,
        deadline,
    }
}

fn setup() -> Setup<'static> {
    setup_with_goal_and_deadline(50, 3600)
}

fn fund(setup: &Setup, addr: &Address, amount_xlm: i128) {
    setup
        .token_admin
        .mint(addr, &(amount_xlm * STROOPS_PER_XLM));
}

#[test]
fn initialize_sets_state() {
    let s = setup();
    let info = s.client.get_status();
    assert_eq!(info.status, Status::Active);
    assert_eq!(info.total_raised, 0);
    assert_eq!(info.goal, s.goal);
    assert_eq!(info.contributors, 0);
    assert_eq!(info.percent_bps, 0);
    assert_eq!(s.client.admin(), s.admin);
    assert_eq!(s.client.token(), s.token);
}

#[test]
fn initialize_cannot_be_called_twice() {
    let s = setup();
    let name = String::from_str(&s.env, "second");
    let result = s
        .client
        .try_initialize(&s.admin, &name, &s.goal, &s.deadline, &s.token);
    assert_eq!(result, Err(Ok(Error::AlreadyInitialized)));
}

#[test]
fn contribute_transfers_tokens_and_updates_state() {
    let s = setup();
    let alice = Address::generate(&s.env);
    fund(&s, &alice, 30);

    s.client.contribute(&alice, &(10 * STROOPS_PER_XLM));

    let info = s.client.get_status();
    assert_eq!(info.total_raised, 10 * STROOPS_PER_XLM);
    assert_eq!(info.contributors, 1);
    assert_eq!(info.status, Status::Active);
    assert_eq!(info.percent_bps, 2000); // 20%
    assert_eq!(s.client.get_contribution(&alice), 10 * STROOPS_PER_XLM);
    assert_eq!(s.token_client.balance(&alice), 20 * STROOPS_PER_XLM);
    assert_eq!(s.token_client.balance(&s.contract), 10 * STROOPS_PER_XLM);
}

#[test]
fn contribute_twice_same_user_does_not_double_count_contributor() {
    let s = setup();
    let alice = Address::generate(&s.env);
    fund(&s, &alice, 30);

    s.client.contribute(&alice, &(5 * STROOPS_PER_XLM));
    s.client.contribute(&alice, &(7 * STROOPS_PER_XLM));

    let info = s.client.get_status();
    assert_eq!(info.contributors, 1);
    assert_eq!(info.total_raised, 12 * STROOPS_PER_XLM);
    assert_eq!(s.client.get_contribution(&alice), 12 * STROOPS_PER_XLM);
}

#[test]
fn contribute_reaching_goal_marks_completed() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let bob = Address::generate(&s.env);
    fund(&s, &alice, 30);
    fund(&s, &bob, 30);

    s.client.contribute(&alice, &(30 * STROOPS_PER_XLM));
    s.client.contribute(&bob, &(20 * STROOPS_PER_XLM));

    let info = s.client.get_status();
    assert_eq!(info.status, Status::Completed);
    assert_eq!(info.total_raised, 50 * STROOPS_PER_XLM);
    assert_eq!(info.percent_bps, 10_000);
}

#[test]
fn contribute_past_deadline_fails() {
    let s = setup();
    let alice = Address::generate(&s.env);
    fund(&s, &alice, 30);

    s.env.ledger().with_mut(|li| {
        li.timestamp = s.deadline + 1;
    });

    let result = s.client.try_contribute(&alice, &(10 * STROOPS_PER_XLM));
    assert_eq!(result, Err(Ok(Error::DeadlinePassed)));
}

#[test]
fn contribute_with_zero_or_negative_amount_fails() {
    let s = setup();
    let alice = Address::generate(&s.env);
    fund(&s, &alice, 30);

    let zero = s.client.try_contribute(&alice, &0);
    assert_eq!(zero, Err(Ok(Error::InvalidAmount)));

    let neg = s.client.try_contribute(&alice, &-5);
    assert_eq!(neg, Err(Ok(Error::InvalidAmount)));
}

#[test]
fn contribute_after_completed_fails() {
    let s = setup();
    let alice = Address::generate(&s.env);
    fund(&s, &alice, 100);

    s.client.contribute(&alice, &(50 * STROOPS_PER_XLM));
    assert_eq!(s.client.get_status().status, Status::Completed);

    let result = s.client.try_contribute(&alice, &(1 * STROOPS_PER_XLM));
    assert_eq!(result, Err(Ok(Error::NotActive)));
}

#[test]
fn withdraw_succeeds_when_goal_reached() {
    let s = setup();
    let alice = Address::generate(&s.env);
    fund(&s, &alice, 100);

    s.client.contribute(&alice, &(50 * STROOPS_PER_XLM));
    let withdrawn = s.client.withdraw();
    assert_eq!(withdrawn, 50 * STROOPS_PER_XLM);
    assert_eq!(s.token_client.balance(&s.admin), 50 * STROOPS_PER_XLM);
    assert_eq!(s.token_client.balance(&s.contract), 0);
    assert_eq!(s.client.get_status().status, Status::Withdrawn);
}

#[test]
fn withdraw_without_meeting_goal_fails() {
    let s = setup();
    let alice = Address::generate(&s.env);
    fund(&s, &alice, 10);

    s.client.contribute(&alice, &(10 * STROOPS_PER_XLM));
    let result = s.client.try_withdraw();
    assert_eq!(result, Err(Ok(Error::NotCompleted)));
}

#[test]
fn withdraw_records_admin_as_required_authorizer() {
    // Verifica que withdraw exige la firma del admin. La SDK rastrea qué
    // direcciones tuvieron que firmar para que la invocación pase; el spec
    // exige que sea la admin y nadie más.
    let s = setup();
    let alice = Address::generate(&s.env);
    fund(&s, &alice, 100);
    s.client.contribute(&alice, &(50 * STROOPS_PER_XLM));
    s.client.withdraw();

    let auths = s.env.auths();
    assert!(
        auths.iter().any(|(addr, _)| addr == &s.admin),
        "withdraw debe requerir la firma del admin, auths: {:?}",
        auths
    );
}

#[test]
fn withdraw_panics_without_admin_auth() {
    // Si no hay autorizaciones explícitas y mock_all_auths está desactivado,
    // admin.require_auth() panica. Demuestra que el control de acceso es real.
    let env = fresh_env();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let attacker = Address::generate(&env);
    let token_issuer = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_issuer);
    let token = token_contract.address();
    let token_admin = StellarAssetClient::new(&env, &token);

    let contract_id = env.register(Crowdfunding, ());
    let client = CrowdfundingClient::new(&env, &contract_id);
    let goal = 50 * STROOPS_PER_XLM;
    let deadline = env.ledger().timestamp() + 3600;
    let name = String::from_str(&env, "vaca");

    client.initialize(&admin, &name, &goal, &deadline, &token);
    token_admin.mint(&attacker, &(100 * STROOPS_PER_XLM));
    client.contribute(&attacker, &(50 * STROOPS_PER_XLM));
    assert_eq!(client.get_status().status, Status::Completed);

    // Desactivamos el mock global pasando un set explícito vacío.
    env.set_auths(&[]);

    let result = client.try_withdraw();
    assert!(
        result.is_err(),
        "withdraw sin firma del admin debería fallar, got {:?}",
        result
    );
}

#[test]
fn check_expiration_marks_failed_after_deadline() {
    let s = setup();
    let alice = Address::generate(&s.env);
    fund(&s, &alice, 30);
    s.client.contribute(&alice, &(10 * STROOPS_PER_XLM));

    s.env.ledger().with_mut(|li| {
        li.timestamp = s.deadline + 1;
    });

    let status = s.client.check_expiration();
    assert_eq!(status, Status::Failed);
    assert_eq!(s.client.get_status().status, Status::Failed);
}

#[test]
fn check_expiration_before_deadline_fails() {
    let s = setup();
    let result = s.client.try_check_expiration();
    assert_eq!(result, Err(Ok(Error::DeadlineNotReached)));
}

#[test]
fn refund_after_failed_returns_contribution() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let bob = Address::generate(&s.env);
    fund(&s, &alice, 30);
    fund(&s, &bob, 30);

    s.client.contribute(&alice, &(10 * STROOPS_PER_XLM));
    s.client.contribute(&bob, &(5 * STROOPS_PER_XLM));

    s.env.ledger().with_mut(|li| {
        li.timestamp = s.deadline + 1;
    });
    s.client.check_expiration();

    let refunded = s.client.refund(&alice);
    assert_eq!(refunded, 10 * STROOPS_PER_XLM);
    assert_eq!(s.token_client.balance(&alice), 30 * STROOPS_PER_XLM);
    assert_eq!(s.client.get_contribution(&alice), 0);

    // Bob aún tiene su contribución registrada hasta que él retire.
    assert_eq!(s.client.get_contribution(&bob), 5 * STROOPS_PER_XLM);
}

#[test]
fn refund_before_failed_fails() {
    let s = setup();
    let alice = Address::generate(&s.env);
    fund(&s, &alice, 30);
    s.client.contribute(&alice, &(10 * STROOPS_PER_XLM));

    let result = s.client.try_refund(&alice);
    assert_eq!(result, Err(Ok(Error::NotFailed)));
}

#[test]
fn refund_with_no_contribution_fails() {
    let s = setup();
    let stranger = Address::generate(&s.env);

    s.env.ledger().with_mut(|li| {
        li.timestamp = s.deadline + 1;
    });
    s.client.check_expiration();

    let result = s.client.try_refund(&stranger);
    assert_eq!(result, Err(Ok(Error::NoContribution)));
}

#[test]
fn extend_deadline_works_while_active() {
    let s = setup();
    let new_deadline = s.deadline + 1800;
    s.client.extend_deadline(&new_deadline);
    assert_eq!(s.client.deadline(), new_deadline);
}

#[test]
fn extend_deadline_cannot_go_backwards() {
    let s = setup();
    let result = s.client.try_extend_deadline(&(s.deadline - 10));
    assert_eq!(result, Err(Ok(Error::DeadlineInPast)));
}

#[test]
fn initialize_rejects_past_deadline() {
    let env = fresh_env();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_issuer = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_issuer);
    let token = token_contract.address();

    let contract = env.register(Crowdfunding, ());
    let client = CrowdfundingClient::new(&env, &contract);
    let name = String::from_str(&env, "vaca");

    let past_deadline = env.ledger().timestamp() - 1;
    let result = client.try_initialize(
        &admin,
        &name,
        &(50 * STROOPS_PER_XLM),
        &past_deadline,
        &token,
    );
    assert_eq!(result, Err(Ok(Error::DeadlineInPast)));
}

#[test]
fn initialize_rejects_zero_goal() {
    let env = fresh_env();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_issuer = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_issuer);
    let token = token_contract.address();

    let contract = env.register(Crowdfunding, ());
    let client = CrowdfundingClient::new(&env, &contract);
    let name = String::from_str(&env, "vaca");
    let deadline = env.ledger().timestamp() + 3600;

    let result = client.try_initialize(&admin, &name, &0i128, &deadline, &token);
    assert_eq!(result, Err(Ok(Error::InvalidGoal)));
}
