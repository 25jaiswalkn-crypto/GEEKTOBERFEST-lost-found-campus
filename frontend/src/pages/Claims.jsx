import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

function Claims() {
  const { id } = useParams();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchClaims();
  }, [id]);

  const fetchClaims = async () => {
    try {
      const response = await api.get(
        `/items/${id}/claims`
      );

      setClaims(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateClaim = async (
    claimId,
    status
  ) => {
    try {
      setUpdatingId(claimId);
      await api.patch(
        `/claims/${claimId}`,
        { status }
      );

      await fetchClaims();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to update claim"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading claims...
      </div>
    );
  }

  const itemTitle = claims[0]?.item?.title;
  const itemStatus = claims[0]?.item?.status;
  const hasApprovedClaim = claims.some((c) => c.status === "approved");
  const canApprove = itemStatus === "active" && !hasApprovedClaim;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Item Claims
          </h1>
          {itemTitle && (
            <p className="mt-1 text-gray-600">
              Claims for: <span className="font-semibold">{itemTitle}</span>
            </p>
          )}
        </div>

        <Link
          to={`/items/${id}`}
          className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to Item
        </Link>
      </div>

      {itemStatus === "claimed" && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
          This item is marked as <strong>Claimed</strong>. Further claim approvals are disabled.
        </div>
      )}

      {itemStatus === "recovered" && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          This item is marked as <strong>Recovered</strong>. Claim approvals are disabled.
        </div>
      )}

      {claims.length === 0 ? (
        <div className="rounded-lg bg-gray-100 p-8 text-center">
          No claims yet.
        </div>
      ) : (
        <div className="space-y-5">
          {claims.map((claim) => (
            <div
              key={claim._id}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {claim.claimant?.name}
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
                    claim.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : claim.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {claim.status}
                </span>
              </div>

              <p className="mb-5 text-gray-600">
                {claim.message}
              </p>

              {claim.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    disabled={!canApprove || updatingId === claim._id}
                    onClick={() =>
                      updateClaim(
                        claim._id,
                        "approved"
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-white ${
                      !canApprove || updatingId === claim._id
                        ? "cursor-not-allowed bg-gray-400"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {updatingId === claim._id ? "Processing..." : "Approve"}
                  </button>

                  <button
                    disabled={updatingId === claim._id}
                    onClick={() =>
                      updateClaim(
                        claim._id,
                        "rejected"
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-white ${
                      updatingId === claim._id
                        ? "cursor-not-allowed bg-gray-400"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Claims;