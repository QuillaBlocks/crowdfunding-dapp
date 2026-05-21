use soroban_sdk::{contractevent, Address, Env};

#[contractevent(topics = ["contribute"])]
pub struct ContributeEvent {
    #[topic]
    pub from: Address,
    pub amount: i128,
    pub total_raised: i128,
}

#[contractevent(topics = ["goal_reached"])]
pub struct GoalReachedEvent {
    pub total_raised: i128,
}

#[contractevent(topics = ["withdrawn"])]
pub struct WithdrawnEvent {
    #[topic]
    pub admin: Address,
    pub amount: i128,
}

#[contractevent(topics = ["refunded"])]
pub struct RefundedEvent {
    #[topic]
    pub from: Address,
    pub amount: i128,
}

#[contractevent(topics = ["expired"])]
pub struct ExpiredEvent {
    pub total_raised: i128,
}

#[contractevent(topics = ["deadline_extended"])]
pub struct DeadlineExtendedEvent {
    pub new_deadline: u64,
}

pub fn contribute(env: &Env, from: &Address, amount: i128, total_raised: i128) {
    ContributeEvent {
        from: from.clone(),
        amount,
        total_raised,
    }
    .publish(env);
}

pub fn goal_reached(env: &Env, total_raised: i128) {
    GoalReachedEvent { total_raised }.publish(env);
}

pub fn withdrawn(env: &Env, admin: &Address, amount: i128) {
    WithdrawnEvent {
        admin: admin.clone(),
        amount,
    }
    .publish(env);
}

pub fn refunded(env: &Env, from: &Address, amount: i128) {
    RefundedEvent {
        from: from.clone(),
        amount,
    }
    .publish(env);
}

pub fn expired(env: &Env, total_raised: i128) {
    ExpiredEvent { total_raised }.publish(env);
}

pub fn deadline_extended(env: &Env, new_deadline: u64) {
    DeadlineExtendedEvent { new_deadline }.publish(env);
}
