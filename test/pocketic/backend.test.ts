import { createIdentity, PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM }));
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  // Fresh canister: no caller is an admin yet.
  await expect(actor.isCallerAdmin()).resolves.toBe(false);
});

it("reports the caller's default role instead of trapping", async () => {
  // A fresh canister has no roles assigned, so the caller is a guest.
  await expect(actor.getCallerUserRole()).resolves.toEqual({ guest: null });
});

it("exposes a schema instead of trapping", async () => {
  const schema = await actor.schema();
  expect(typeof schema).toBe("string");
  expect(schema.length).toBeGreaterThan(0);
});

it("round-trips an admin role assignment through the real canister", async () => {
  // Use a deterministic identity so we can pass its principal to the role
  // assignment and verify the caller is then recognized as admin. The identity
  // must be the caller for _initialize_access_control, which registers the
  // first non-anonymous caller as admin.
  const identity = createIdentity("audioforge-admin");
  actor.setIdentity(identity);
  await expect(actor._initialize_access_control()).resolves.toBeNull();
  await expect(
    actor.assignCallerUserRole(identity.getPrincipal(), { admin: null }),
  ).resolves.toBeNull();
  await expect(actor.isCallerAdmin()).resolves.toBe(true);
  await expect(actor.getCallerUserRole()).resolves.toEqual({ admin: null });
});
