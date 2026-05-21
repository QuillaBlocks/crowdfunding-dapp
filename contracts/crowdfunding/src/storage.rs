use soroban_sdk::{contracttype, Address, Env, String};

use crate::contract::Status;

const INSTANCE_BUMP_THRESHOLD: u32 = 7 * 17280; // ~7 days at 5s ledgers
const INSTANCE_BUMP_AMOUNT: u32 = 30 * 17280; // ~30 days

const CONTRIBUTION_BUMP_THRESHOLD: u32 = 30 * 17280; // ~30 days
const CONTRIBUTION_BUMP_AMOUNT: u32 = 120 * 17280; // ~120 days

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Name,
    Goal,
    Deadline,
    TotalRaised,
    Status,
    Token,
    Contributors,
    Contribution(Address),
}

pub fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_BUMP_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn set_name(env: &Env, name: &String) {
    env.storage().instance().set(&DataKey::Name, name);
}

pub fn get_name(env: &Env) -> String {
    env.storage().instance().get(&DataKey::Name).unwrap()
}

pub fn set_goal(env: &Env, goal: i128) {
    env.storage().instance().set(&DataKey::Goal, &goal);
}

pub fn get_goal(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::Goal).unwrap()
}

pub fn set_deadline(env: &Env, deadline: u64) {
    env.storage().instance().set(&DataKey::Deadline, &deadline);
}

pub fn get_deadline(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::Deadline).unwrap()
}

pub fn set_total_raised(env: &Env, total: i128) {
    env.storage().instance().set(&DataKey::TotalRaised, &total);
}

pub fn get_total_raised(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalRaised)
        .unwrap_or(0)
}

pub fn set_status(env: &Env, status: &Status) {
    env.storage().instance().set(&DataKey::Status, status);
}

pub fn get_status(env: &Env) -> Status {
    env.storage().instance().get(&DataKey::Status).unwrap()
}

pub fn set_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::Token, token);
}

pub fn get_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn set_contributors_count(env: &Env, count: u32) {
    env.storage()
        .instance()
        .set(&DataKey::Contributors, &count);
}

pub fn get_contributors_count(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::Contributors)
        .unwrap_or(0)
}

pub fn get_contribution(env: &Env, addr: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Contribution(addr.clone()))
        .unwrap_or(0)
}

pub fn set_contribution(env: &Env, addr: &Address, amount: i128) {
    let key = DataKey::Contribution(addr.clone());
    env.storage().persistent().set(&key, &amount);
    env.storage()
        .persistent()
        .extend_ttl(&key, CONTRIBUTION_BUMP_THRESHOLD, CONTRIBUTION_BUMP_AMOUNT);
}
