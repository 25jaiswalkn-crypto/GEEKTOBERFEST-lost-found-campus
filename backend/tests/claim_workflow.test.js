const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("../src/db/db");
const app = require("../src/app");
const User = require("../src/models/User");
const Item = require("../src/models/Item");
const Claim = require("../src/models/Claim");

describe("Claimed and Recovered Status Workflow Tests", () => {
  let server;
  let baseUrl;
  let reporterToken;
  let reporterId;
  let claimantToken;
  let claimantId;
  let strangerToken;
  let strangerId;

  const createdUserIds = [];
  const createdItemIds = [];
  const createdClaimIds = [];

  const apiRequest = async (endpoint, options = {}) => {
    const url = `${baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
  };

  before(async () => {
    await connectDB();

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    const timestamp = Date.now();

    // Register reporter
    const repRes = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Reporter Test",
        email: `reporter_${timestamp}@test.edu`,
        password: "password123",
      }),
    });
    assert.equal(repRes.status, 201, "Reporter registration failed");
    reporterToken = repRes.data.token;
    reporterId = repRes.data.user.id;
    createdUserIds.push(reporterId);

    // Register claimant
    const claRes = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Claimant Test",
        email: `claimant_${timestamp}@test.edu`,
        password: "password123",
      }),
    });
    assert.equal(claRes.status, 201, "Claimant registration failed");
    claimantToken = claRes.data.token;
    claimantId = claRes.data.user.id;
    createdUserIds.push(claimantId);

    // Register stranger (unauthorized user)
    const strRes = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Stranger Test",
        email: `stranger_${timestamp}@test.edu`,
        password: "password123",
      }),
    });
    assert.equal(strRes.status, 201, "Stranger registration failed");
    strangerToken = strRes.data.token;
    strangerId = strRes.data.user.id;
    createdUserIds.push(strangerId);
  });

  after(async () => {
    try {
      if (createdClaimIds.length > 0) {
        await Claim.deleteMany({ _id: { $in: createdClaimIds } });
      }
      if (createdItemIds.length > 0) {
        await Item.deleteMany({ _id: { $in: createdItemIds } });
      }
      if (createdUserIds.length > 0) {
        await User.deleteMany({ _id: { $in: createdUserIds } });
      }
    } finally {
      if (server) {
        await new Promise((resolve) => server.close(resolve));
      }
      await mongoose.disconnect();
    }
  });

  const createTestItem = async (custom = {}) => {
    const item = await Item.create({
      title: "Blue Backpack",
      description: "Lost blue Jansport backpack with books inside",
      type: "found",
      category: "Bags",
      location: "Library",
      date: new Date(),
      status: "active",
      reportedBy: reporterId,
      ...custom,
    });
    createdItemIds.push(item._id.toString());
    return item;
  };

  const createTestClaim = async (itemId, claimantIdToUse = claimantId, status = "pending") => {
    const claim = await Claim.create({
      item: itemId,
      claimant: claimantIdToUse,
      message: "This is my blue backpack with calculus notes inside",
      status,
    });
    createdClaimIds.push(claim._id.toString());
    return claim;
  };

  it("1. A valid claim is approved and the associated item becomes claimed", async () => {
    const item = await createTestItem();
    const claim = await createTestClaim(item._id);

    const res = await apiRequest(`/claims/${claim._id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "approved" }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.claim.status, "approved");

    const refreshedItem = await Item.findById(item._id);
    assert.equal(refreshedItem.status, "claimed", "Item status must be 'claimed'");
  });

  it("2. The claim and item retain their correct, distinct statuses", async () => {
    const item = await createTestItem();
    const claim = await createTestClaim(item._id);

    await apiRequest(`/claims/${claim._id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "approved" }),
    });

    const refreshedClaim = await Claim.findById(claim._id);
    const refreshedItem = await Item.findById(item._id);

    assert.equal(refreshedClaim.status, "approved", "Claim status must be approved");
    assert.equal(refreshedItem.status, "claimed", "Item status must be claimed");
    assert.notEqual(refreshedItem.status, "recovered", "Item status must not be recovered");
  });

  it("3. Rejecting a claim does not mark the item as claimed", async () => {
    const item = await createTestItem();
    const claim = await createTestClaim(item._id);

    const res = await apiRequest(`/claims/${claim._id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "rejected" }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.claim.status, "rejected");

    const refreshedItem = await Item.findById(item._id);
    assert.equal(refreshedItem.status, "active", "Item status must remain active");
  });

  it("4. A recovered item cannot be incorrectly changed to claimed", async () => {
    // 4a. Cannot approve claim on a recovered item
    const recoveredItem = await createTestItem({ status: "recovered" });
    const claim = await createTestClaim(recoveredItem._id);

    const approveRes = await apiRequest(`/claims/${claim._id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "approved" }),
    });

    assert.equal(approveRes.status, 400);
    assert.match(approveRes.data.message, /recovered/i);

    const itemAfterApprove = await Item.findById(recoveredItem._id);
    assert.equal(itemAfterApprove.status, "recovered");

    // 4b. Direct transition from recovered to claimed via updateStatus is rejected
    const updateRes = await apiRequest(`/items/${recoveredItem._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "claimed" }),
    });

    assert.equal(updateRes.status, 400);
    const itemAfterDirectUpdate = await Item.findById(recoveredItem._id);
    assert.equal(itemAfterDirectUpdate.status, "recovered");
  });

  it("5. An unauthorized user cannot approve a claim", async () => {
    const item = await createTestItem();
    const claim = await createTestClaim(item._id);

    const res = await apiRequest(`/claims/${claim._id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${strangerToken}` },
      body: JSON.stringify({ status: "approved" }),
    });

    assert.equal(res.status, 403);

    const refreshedClaim = await Claim.findById(claim._id);
    assert.equal(refreshedClaim.status, "pending");

    const refreshedItem = await Item.findById(item._id);
    assert.equal(refreshedItem.status, "active");
  });

  it("6. A nonexistent claim or item produces an appropriate error", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    // Nonexistent claim
    const claimRes = await apiRequest(`/claims/${fakeId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "approved" }),
    });
    assert.equal(claimRes.status, 404);

    // Nonexistent item status update
    const itemRes = await apiRequest(`/items/${fakeId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "recovered" }),
    });
    assert.equal(itemRes.status, 404);

    // Invalid ID format produces 400
    const invalidIdRes = await apiRequest(`/claims/not-a-valid-id`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "approved" }),
    });
    assert.equal(invalidIdRes.status, 400);
  });

  it("7. Invalid status transitions are rejected", async () => {
    const item = await createTestItem({ status: "active" });

    // 7a. Direct transition to 'claimed' via item status endpoint is rejected
    const directClaimRes = await apiRequest(`/items/${item._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "claimed" }),
    });
    assert.equal(directClaimRes.status, 400);

    // 7b. Item marked recovered
    const recoverRes = await apiRequest(`/items/${item._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "recovered" }),
    });
    assert.equal(recoverRes.status, 200);

    // 7c. Recovered to claimed is rejected
    const recToClaimRes = await apiRequest(`/items/${item._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "claimed" }),
    });
    assert.equal(recToClaimRes.status, 400);

    // 7d. Already claimed item cannot be changed to recovered
    const claimedItem = await createTestItem({ status: "claimed" });
    const claimToRecRes = await apiRequest(`/items/${claimedItem._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "recovered" }),
    });
    assert.equal(claimToRecRes.status, 400);
  });

  it("8. Two conflicting approval attempts do not produce inconsistent results", async () => {
    const item = await createTestItem();

    // Create two competing claims on the same item
    const claim1 = await createTestClaim(item._id, claimantId);
    const claim2 = await createTestClaim(item._id, strangerId);

    // Approve claim 1
    const res1 = await apiRequest(`/claims/${claim1._id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "approved" }),
    });
    assert.equal(res1.status, 200);
    assert.equal(res1.data.claim.status, "approved");

    // Attempt to approve claim 2 on the same item
    const res2 = await apiRequest(`/claims/${claim2._id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "approved" }),
    });
    // Should be rejected because item is already claimed
    assert.ok(res2.status === 400 || res2.status === 409, `Expected 400 or 409, got ${res2.status}`);

    const refreshedClaim2 = await Claim.findById(claim2._id);
    assert.notEqual(refreshedClaim2.status, "approved", "Claim 2 must not be approved");

    const refreshedItem = await Item.findById(item._id);
    assert.equal(refreshedItem.status, "claimed", "Item remains claimed");
  });

  it("9. Repeated requests do not cause unintended state changes", async () => {
    const item = await createTestItem();
    const claim = await createTestClaim(item._id);

    // First approval
    const res1 = await apiRequest(`/claims/${claim._id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "approved" }),
    });
    assert.equal(res1.status, 200);

    // Repeat approval attempt on already approved claim
    const res2 = await apiRequest(`/claims/${claim._id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "approved" }),
    });
    assert.equal(res2.status, 400, "Repeated approval must be rejected with 400");
    assert.match(res2.data.message, /already/i);

    // Idempotent item status update with identical status returns 200 without changing state
    const res3 = await apiRequest(`/items/${item._id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ status: "claimed" }),
    });
    assert.equal(res3.status, 200);
  });

  it("10. Existing valid item and claim workflows continue to work", async () => {
    const item = await createTestItem({ status: "active" });

    // 10a. Claimant submits claim via API
    const submitClaimRes = await apiRequest(`/items/${item._id}/claims`, {
      method: "POST",
      headers: { Authorization: `Bearer ${claimantToken}` },
      body: JSON.stringify({ message: "I lost this yesterday at the library second floor" }),
    });
    assert.equal(submitClaimRes.status, 201);
    assert.equal(submitClaimRes.data.claim.status, "pending");
    createdClaimIds.push(submitClaimRes.data.claim._id);

    // 10b. Reporter views claims on item
    const getClaimsRes = await apiRequest(`/items/${item._id}/claims`, {
      method: "GET",
      headers: { Authorization: `Bearer ${reporterToken}` },
    });
    assert.equal(getClaimsRes.status, 200);
    assert.ok(Array.isArray(getClaimsRes.data));
    assert.equal(getClaimsRes.data.length, 1);
    assert.equal(getClaimsRes.data[0].claimant.name, "Claimant Test");

    // 10c. Submitting claim on non-active item is rejected
    const recoveredItem = await createTestItem({ status: "recovered" });
    const claimRecoveredRes = await apiRequest(`/items/${recoveredItem._id}/claims`, {
      method: "POST",
      headers: { Authorization: `Bearer ${claimantToken}` },
      body: JSON.stringify({ message: "Attempting to claim recovered item" }),
    });
    assert.equal(claimRecoveredRes.status, 400);

    // 10d. User cannot claim their own item
    const ownClaimRes = await apiRequest(`/items/${item._id}/claims`, {
      method: "POST",
      headers: { Authorization: `Bearer ${reporterToken}` },
      body: JSON.stringify({ message: "Claiming my own item" }),
    });
    assert.equal(ownClaimRes.status, 400);
  });
});
