use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, String,
};

use crate::events;
use crate::storage;

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Status {
    Active = 0,
    Completed = 1,
    Failed = 2,
    Withdrawn = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StatusInfo {
    pub status: Status,
    pub total_raised: i128,
    pub goal: i128,
    pub deadline: u64,
    pub now: u64,
    pub contributors: u32,
    pub percent_bps: u32,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidAmount = 3,
    DeadlinePassed = 4,
    NotActive = 5,
    NotCompleted = 6,
    NotFailed = 7,
    NoContribution = 8,
    DeadlineInPast = 9,
    DeadlineNotReached = 10,
    InvalidGoal = 11,
}

#[contract]
pub struct Crowdfunding;

#[contractimpl]
impl Crowdfunding {
    /// Inicializa el crowdfunding. Solo se puede llamar una vez. La firma del
    /// admin se requiere para que la primera llamada sea explícitamente suya.
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        goal: i128,
        deadline: u64,
        token: Address,
    ) -> Result<(), Error> {
        if storage::is_initialized(&env) {
            return Err(Error::AlreadyInitialized);
        }
        if goal <= 0 {
            return Err(Error::InvalidGoal);
        }
        if deadline <= env.ledger().timestamp() {
            return Err(Error::DeadlineInPast);
        }

        admin.require_auth();

        storage::set_admin(&env, &admin);
        storage::set_name(&env, &name);
        storage::set_goal(&env, goal);
        storage::set_deadline(&env, deadline);
        storage::set_token(&env, &token);
        storage::set_total_raised(&env, 0);
        storage::set_contributors_count(&env, 0);
        storage::set_status(&env, &Status::Active);
        storage::extend_instance_ttl(&env);

        Ok(())
    }

    /// Aporta `amount` al crowdfunding. Requiere autorización de `from`.
    /// Transfiere el token al contrato y actualiza el estado.
    pub fn contribute(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        if !storage::is_initialized(&env) {
            return Err(Error::NotInitialized);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let status = storage::get_status(&env);
        if status != Status::Active {
            return Err(Error::NotActive);
        }

        let deadline = storage::get_deadline(&env);
        if env.ledger().timestamp() >= deadline {
            return Err(Error::DeadlinePassed);
        }

        from.require_auth();

        let token = storage::get_token(&env);
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&from, &env.current_contract_address(), &amount);

        let prev_contribution = storage::get_contribution(&env, &from);
        let new_contribution = prev_contribution + amount;
        storage::set_contribution(&env, &from, new_contribution);

        if prev_contribution == 0 {
            let count = storage::get_contributors_count(&env);
            storage::set_contributors_count(&env, count + 1);
        }

        let new_total = storage::get_total_raised(&env) + amount;
        storage::set_total_raised(&env, new_total);

        events::contribute(&env, &from, amount, new_total);

        let goal = storage::get_goal(&env);
        if new_total >= goal {
            storage::set_status(&env, &Status::Completed);
            events::goal_reached(&env, new_total);
        }

        storage::extend_instance_ttl(&env);
        Ok(())
    }

    /// Devuelve a `from` lo que aportó si el crowdfunding terminó como Failed.
    pub fn refund(env: Env, from: Address) -> Result<i128, Error> {
        if !storage::is_initialized(&env) {
            return Err(Error::NotInitialized);
        }

        let status = storage::get_status(&env);
        if status != Status::Failed {
            return Err(Error::NotFailed);
        }

        from.require_auth();

        let amount = storage::get_contribution(&env, &from);
        if amount <= 0 {
            return Err(Error::NoContribution);
        }

        storage::set_contribution(&env, &from, 0);

        let token = storage::get_token(&env);
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &from, &amount);

        events::refunded(&env, &from, amount);
        storage::extend_instance_ttl(&env);
        Ok(amount)
    }

    /// Solo admin. Transfiere todos los fondos al admin si la meta se alcanzó.
    pub fn withdraw(env: Env) -> Result<i128, Error> {
        if !storage::is_initialized(&env) {
            return Err(Error::NotInitialized);
        }

        let status = storage::get_status(&env);
        if status != Status::Completed {
            return Err(Error::NotCompleted);
        }

        let admin = storage::get_admin(&env);
        admin.require_auth();

        let amount = storage::get_total_raised(&env);
        let token = storage::get_token(&env);
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &admin, &amount);

        storage::set_status(&env, &Status::Withdrawn);
        events::withdrawn(&env, &admin, amount);
        storage::extend_instance_ttl(&env);
        Ok(amount)
    }

    /// Solo admin. Extiende el deadline. El nuevo deadline debe ser posterior al actual.
    /// Solo permitido si el crowdfunding sigue Active.
    pub fn extend_deadline(env: Env, new_deadline: u64) -> Result<(), Error> {
        if !storage::is_initialized(&env) {
            return Err(Error::NotInitialized);
        }

        let status = storage::get_status(&env);
        if status != Status::Active {
            return Err(Error::NotActive);
        }

        let current_deadline = storage::get_deadline(&env);
        if new_deadline <= current_deadline {
            return Err(Error::DeadlineInPast);
        }

        let admin = storage::get_admin(&env);
        admin.require_auth();

        storage::set_deadline(&env, new_deadline);
        events::deadline_extended(&env, new_deadline);
        storage::extend_instance_ttl(&env);
        Ok(())
    }

    /// Cualquiera puede llamarlo. Si el deadline pasó y el estado sigue Active,
    /// lo marca como Failed para habilitar refunds.
    pub fn check_expiration(env: Env) -> Result<Status, Error> {
        if !storage::is_initialized(&env) {
            return Err(Error::NotInitialized);
        }

        let status = storage::get_status(&env);
        if status != Status::Active {
            return Ok(status);
        }

        let deadline = storage::get_deadline(&env);
        if env.ledger().timestamp() < deadline {
            return Err(Error::DeadlineNotReached);
        }

        storage::set_status(&env, &Status::Failed);
        let total = storage::get_total_raised(&env);
        events::expired(&env, total);
        storage::extend_instance_ttl(&env);
        Ok(Status::Failed)
    }

    /// Estado completo del crowdfunding, listo para mostrar en UI.
    pub fn get_status(env: Env) -> Result<StatusInfo, Error> {
        if !storage::is_initialized(&env) {
            return Err(Error::NotInitialized);
        }

        let status = storage::get_status(&env);
        let total_raised = storage::get_total_raised(&env);
        let goal = storage::get_goal(&env);
        let deadline = storage::get_deadline(&env);
        let contributors = storage::get_contributors_count(&env);
        let now = env.ledger().timestamp();

        let percent_bps = if goal > 0 {
            let bps = (total_raised.saturating_mul(10_000)) / goal;
            if bps > 10_000 {
                10_000
            } else {
                bps as u32
            }
        } else {
            0
        };

        Ok(StatusInfo {
            status,
            total_raised,
            goal,
            deadline,
            now,
            contributors,
            percent_bps,
        })
    }

    pub fn get_contribution(env: Env, addr: Address) -> i128 {
        if !storage::is_initialized(&env) {
            return 0;
        }
        storage::get_contribution(&env, &addr)
    }

    pub fn total_raised(env: Env) -> i128 {
        if !storage::is_initialized(&env) {
            return 0;
        }
        storage::get_total_raised(&env)
    }

    pub fn total_contributors(env: Env) -> u32 {
        if !storage::is_initialized(&env) {
            return 0;
        }
        storage::get_contributors_count(&env)
    }

    pub fn admin(env: Env) -> Result<Address, Error> {
        if !storage::is_initialized(&env) {
            return Err(Error::NotInitialized);
        }
        Ok(storage::get_admin(&env))
    }

    pub fn name(env: Env) -> Result<String, Error> {
        if !storage::is_initialized(&env) {
            return Err(Error::NotInitialized);
        }
        Ok(storage::get_name(&env))
    }

    pub fn goal(env: Env) -> Result<i128, Error> {
        if !storage::is_initialized(&env) {
            return Err(Error::NotInitialized);
        }
        Ok(storage::get_goal(&env))
    }

    pub fn deadline(env: Env) -> Result<u64, Error> {
        if !storage::is_initialized(&env) {
            return Err(Error::NotInitialized);
        }
        Ok(storage::get_deadline(&env))
    }

    pub fn token(env: Env) -> Result<Address, Error> {
        if !storage::is_initialized(&env) {
            return Err(Error::NotInitialized);
        }
        Ok(storage::get_token(&env))
    }
}
