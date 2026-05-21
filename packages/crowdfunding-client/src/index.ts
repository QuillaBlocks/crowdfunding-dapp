import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CDWRAOIW5HEKMFZ62JN4CIW6DCAQFU2PLZX4RKJMRPIFKDZW5ZK2NNSO",
  }
} as const







export type DataKey = {tag: "Admin", values: void} | {tag: "Name", values: void} | {tag: "Goal", values: void} | {tag: "Deadline", values: void} | {tag: "TotalRaised", values: void} | {tag: "Status", values: void} | {tag: "Token", values: void} | {tag: "Contributors", values: void} | {tag: "Contribution", values: readonly [string]};

export const Errors = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"InvalidAmount"},
  4: {message:"DeadlinePassed"},
  5: {message:"NotActive"},
  6: {message:"NotCompleted"},
  7: {message:"NotFailed"},
  8: {message:"NoContribution"},
  9: {message:"DeadlineInPast"},
  10: {message:"DeadlineNotReached"},
  11: {message:"InvalidGoal"}
}

export enum Status {
  Active = 0,
  Completed = 1,
  Failed = 2,
  Withdrawn = 3,
}


export interface StatusInfo {
  contributors: u32;
  deadline: u64;
  goal: i128;
  now: u64;
  percent_bps: u32;
  status: Status;
  total_raised: i128;
}

export interface Client {
  /**
   * Construct and simulate a goal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  goal: (options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a name transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  name: (options?: MethodOptions) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  admin: (options?: MethodOptions) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  token: (options?: MethodOptions) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a refund transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Devuelve a `from` lo que aportó si el crowdfunding terminó como Failed.
   */
  refund: ({from}: {from: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a deadline transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  deadline: (options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Solo admin. Transfiere todos los fondos al admin si la meta se alcanzó.
   */
  withdraw: (options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a contribute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Aporta `amount` al crowdfunding. Requiere autorización de `from`.
   * Transfiere el token al contrato y actualiza el estado.
   */
  contribute: ({from, amount}: {from: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_status transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Estado completo del crowdfunding, listo para mostrar en UI.
   */
  get_status: (options?: MethodOptions) => Promise<AssembledTransaction<Result<StatusInfo>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Inicializa el crowdfunding. Solo se puede llamar una vez. La firma del
   * admin se requiere para que la primera llamada sea explícitamente suya.
   */
  initialize: ({admin, name, goal, deadline, token}: {admin: string, name: string, goal: i128, deadline: u64, token: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a total_raised transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  total_raised: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a extend_deadline transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Solo admin. Extiende el deadline. El nuevo deadline debe ser posterior al actual.
   * Solo permitido si el crowdfunding sigue Active.
   */
  extend_deadline: ({new_deadline}: {new_deadline: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a check_expiration transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cualquiera puede llamarlo. Si el deadline pasó y el estado sigue Active,
   * lo marca como Failed para habilitar refunds.
   */
  check_expiration: (options?: MethodOptions) => Promise<AssembledTransaction<Result<Status>>>

  /**
   * Construct and simulate a get_contribution transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_contribution: ({addr}: {addr: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a total_contributors transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  total_contributors: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABQAAAAAAAAAAAAAADEV4cGlyZWRFdmVudAAAAAEAAAAHZXhwaXJlZAAAAAABAAAAAAAAAAx0b3RhbF9yYWlzZWQAAAALAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAADVJlZnVuZGVkRXZlbnQAAAAAAAABAAAACHJlZnVuZGVkAAAAAgAAAAAAAAAEZnJvbQAAABMAAAABAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAADldpdGhkcmF3bkV2ZW50AAAAAAABAAAACXdpdGhkcmF3bgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAEAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAAD0NvbnRyaWJ1dGVFdmVudAAAAAABAAAACmNvbnRyaWJ1dGUAAAAAAAMAAAAAAAAABGZyb20AAAATAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAAAAAAMdG90YWxfcmFpc2VkAAAACwAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAAEEdvYWxSZWFjaGVkRXZlbnQAAAABAAAADGdvYWxfcmVhY2hlZAAAAAEAAAAAAAAADHRvdGFsX3JhaXNlZAAAAAsAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAFURlYWRsaW5lRXh0ZW5kZWRFdmVudAAAAAAAAAEAAAARZGVhZGxpbmVfZXh0ZW5kZWQAAAAAAAABAAAAAAAAAAxuZXdfZGVhZGxpbmUAAAAGAAAAAAAAAAI=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAACQAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAETmFtZQAAAAAAAAAAAAAABEdvYWwAAAAAAAAAAAAAAAhEZWFkbGluZQAAAAAAAAAAAAAAC1RvdGFsUmFpc2VkAAAAAAAAAAAAAAAABlN0YXR1cwAAAAAAAAAAAAAAAAAFVG9rZW4AAAAAAAAAAAAAAAAAAAxDb250cmlidXRvcnMAAAABAAAAAAAAAAxDb250cmlidXRpb24AAAABAAAAEw==",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAACwAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAgAAAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAAMAAAAAAAAADkRlYWRsaW5lUGFzc2VkAAAAAAAEAAAAAAAAAAlOb3RBY3RpdmUAAAAAAAAFAAAAAAAAAAxOb3RDb21wbGV0ZWQAAAAGAAAAAAAAAAlOb3RGYWlsZWQAAAAAAAAHAAAAAAAAAA5Ob0NvbnRyaWJ1dGlvbgAAAAAACAAAAAAAAAAORGVhZGxpbmVJblBhc3QAAAAAAAkAAAAAAAAAEkRlYWRsaW5lTm90UmVhY2hlZAAAAAAACgAAAAAAAAALSW52YWxpZEdvYWwAAAAACw==",
        "AAAAAwAAAAAAAAAAAAAABlN0YXR1cwAAAAAABAAAAAAAAAAGQWN0aXZlAAAAAAAAAAAAAAAAAAlDb21wbGV0ZWQAAAAAAAABAAAAAAAAAAZGYWlsZWQAAAAAAAIAAAAAAAAACVdpdGhkcmF3bgAAAAAAAAM=",
        "AAAAAAAAAAAAAAAEZ29hbAAAAAAAAAABAAAD6QAAAAsAAAAD",
        "AAAAAAAAAAAAAAAEbmFtZQAAAAAAAAABAAAD6QAAABAAAAAD",
        "AAAAAQAAAAAAAAAAAAAAClN0YXR1c0luZm8AAAAAAAcAAAAAAAAADGNvbnRyaWJ1dG9ycwAAAAQAAAAAAAAACGRlYWRsaW5lAAAABgAAAAAAAAAEZ29hbAAAAAsAAAAAAAAAA25vdwAAAAAGAAAAAAAAAAtwZXJjZW50X2JwcwAAAAAEAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAAGU3RhdHVzAAAAAAAAAAAADHRvdGFsX3JhaXNlZAAAAAs=",
        "AAAAAAAAAAAAAAAFYWRtaW4AAAAAAAAAAAAAAQAAA+kAAAATAAAAAw==",
        "AAAAAAAAAAAAAAAFdG9rZW4AAAAAAAAAAAAAAQAAA+kAAAATAAAAAw==",
        "AAAAAAAAAElEZXZ1ZWx2ZSBhIGBmcm9tYCBsbyBxdWUgYXBvcnTDsyBzaSBlbCBjcm93ZGZ1bmRpbmcgdGVybWluw7MgY29tbyBGYWlsZWQuAAAAAAAABnJlZnVuZAAAAAAAAQAAAAAAAAAEZnJvbQAAABMAAAABAAAD6QAAAAsAAAAD",
        "AAAAAAAAAAAAAAAIZGVhZGxpbmUAAAAAAAAAAQAAA+kAAAAGAAAAAw==",
        "AAAAAAAAAEhTb2xvIGFkbWluLiBUcmFuc2ZpZXJlIHRvZG9zIGxvcyBmb25kb3MgYWwgYWRtaW4gc2kgbGEgbWV0YSBzZSBhbGNhbnrDsy4AAAAId2l0aGRyYXcAAAAAAAAAAQAAA+kAAAALAAAAAw==",
        "AAAAAAAAAHlBcG9ydGEgYGFtb3VudGAgYWwgY3Jvd2RmdW5kaW5nLiBSZXF1aWVyZSBhdXRvcml6YWNpw7NuIGRlIGBmcm9tYC4KVHJhbnNmaWVyZSBlbCB0b2tlbiBhbCBjb250cmF0byB5IGFjdHVhbGl6YSBlbCBlc3RhZG8uAAAAAAAACmNvbnRyaWJ1dGUAAAAAAAIAAAAAAAAABGZyb20AAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAADtFc3RhZG8gY29tcGxldG8gZGVsIGNyb3dkZnVuZGluZywgbGlzdG8gcGFyYSBtb3N0cmFyIGVuIFVJLgAAAAAKZ2V0X3N0YXR1cwAAAAAAAAAAAAEAAAPpAAAH0AAAAApTdGF0dXNJbmZvAAAAAAAD",
        "AAAAAAAAAI5JbmljaWFsaXphIGVsIGNyb3dkZnVuZGluZy4gU29sbyBzZSBwdWVkZSBsbGFtYXIgdW5hIHZlei4gTGEgZmlybWEgZGVsCmFkbWluIHNlIHJlcXVpZXJlIHBhcmEgcXVlIGxhIHByaW1lcmEgbGxhbWFkYSBzZWEgZXhwbMOtY2l0YW1lbnRlIHN1eWEuAAAAAAAKaW5pdGlhbGl6ZQAAAAAABQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAEZ29hbAAAAAsAAAAAAAAACGRlYWRsaW5lAAAABgAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAAAAAAAMdG90YWxfcmFpc2VkAAAAAAAAAAEAAAAL",
        "AAAAAAAAAIFTb2xvIGFkbWluLiBFeHRpZW5kZSBlbCBkZWFkbGluZS4gRWwgbnVldm8gZGVhZGxpbmUgZGViZSBzZXIgcG9zdGVyaW9yIGFsIGFjdHVhbC4KU29sbyBwZXJtaXRpZG8gc2kgZWwgY3Jvd2RmdW5kaW5nIHNpZ3VlIEFjdGl2ZS4AAAAAAAAPZXh0ZW5kX2RlYWRsaW5lAAAAAAEAAAAAAAAADG5ld19kZWFkbGluZQAAAAYAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAHZDdWFscXVpZXJhIHB1ZWRlIGxsYW1hcmxvLiBTaSBlbCBkZWFkbGluZSBwYXPDsyB5IGVsIGVzdGFkbyBzaWd1ZSBBY3RpdmUsCmxvIG1hcmNhIGNvbW8gRmFpbGVkIHBhcmEgaGFiaWxpdGFyIHJlZnVuZHMuAAAAAAAQY2hlY2tfZXhwaXJhdGlvbgAAAAAAAAABAAAD6QAAB9AAAAAGU3RhdHVzAAAAAAAD",
        "AAAAAAAAAAAAAAAQZ2V0X2NvbnRyaWJ1dGlvbgAAAAEAAAAAAAAABGFkZHIAAAATAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAASdG90YWxfY29udHJpYnV0b3JzAAAAAAAAAAAAAQAAAAQ=" ]),
      options
    )
  }
  public readonly fromJSON = {
    goal: this.txFromJSON<Result<i128>>,
        name: this.txFromJSON<Result<string>>,
        admin: this.txFromJSON<Result<string>>,
        token: this.txFromJSON<Result<string>>,
        refund: this.txFromJSON<Result<i128>>,
        deadline: this.txFromJSON<Result<u64>>,
        withdraw: this.txFromJSON<Result<i128>>,
        contribute: this.txFromJSON<Result<void>>,
        get_status: this.txFromJSON<Result<StatusInfo>>,
        initialize: this.txFromJSON<Result<void>>,
        total_raised: this.txFromJSON<i128>,
        extend_deadline: this.txFromJSON<Result<void>>,
        check_expiration: this.txFromJSON<Result<Status>>,
        get_contribution: this.txFromJSON<i128>,
        total_contributors: this.txFromJSON<u32>
  }
}