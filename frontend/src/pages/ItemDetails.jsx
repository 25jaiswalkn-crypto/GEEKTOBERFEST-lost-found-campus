import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [claimMessage, setClaimMessage] =
    useState("");

  const [showClaim, setShowClaim] =
    useState(false);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await api.get(
        `/items/${id}`
      );

      setItem(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isOwner =
    user &&
    item &&
    item.reportedBy?._id === user.id;

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/items/${id}`);

      alert("Report deleted");

      navigate("/items");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to delete"
      );
    }
  };

  const handleRecovered = async () => {
    try {
      await api.patch(
        `/items/${id}/status`,
        {
          status: "recovered",
        }
      );

      fetchItem();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to update status"
      );
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();

    try {
      await api.post(
        `/items/${id}/claims`,
        {
          message: claimMessage,
        }
      );

      alert("Claim submitted!");

      setClaimMessage("");
      setShowClaim(false);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to submit claim"
      );
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-10 text-center">
        Item not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="h-80 w-full object-cover"
          />
        ) : (
          <div className="flex h-80 items-center justify-center bg-gray-100 text-gray-400">
            No Image
          </div>
        )}

        <div className="p-8">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold">
              {item.title}
            </h1>

            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                item.type === "lost"
                  ? "bg-red-100 text-red-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {item.type.toUpperCase()}
            </span>
          </div>

          <p className="mb-6 text-gray-600">
            {item.description}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <strong>Category:</strong>{" "}
              {item.category}
            </div>

            <div>
              <strong>Location:</strong>{" "}
              {item.location}
            </div>

            <div>
              <strong>Date:</strong>{" "}
              {new Date(item.date).toLocaleDateString()}
            </div>

            <div>
              <strong>Status:</strong>{" "}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  item.status === "claimed"
                    ? "bg-blue-100 text-blue-700"
                    : item.status === "recovered"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {item.status}
              </span>
            </div>

            <div>
              <strong>Reported By:</strong>{" "}
              {item.reportedBy?.name}
            </div>
          </div>

          {/* Owner buttons */}
          {isOwner && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={`/items/${item._id}/edit`}
                className="rounded-lg bg-blue-600 px-5 py-2 text-white"
              >
                Edit
              </Link>

              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-5 py-2 text-white"
              >
                Delete
              </button>

              {item.status === "active" && (
                <button
                  onClick={handleRecovered}
                  className="rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700"
                >
                  Mark Recovered
                </button>
              )}

              <Link
                to={`/items/${item._id}/claims`}
                className="rounded-lg border px-5 py-2"
              >
                View Claims
              </Link>
            </div>
          )}

          {/* Claim */}
          {!isOwner &&
            user &&
            item.status === "active" && (
              <div className="mt-8">
                {!showClaim ? (
                  <button
                    onClick={() => setShowClaim(true)}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-white"
                  >
                    Claim This Item
                  </button>
                ) : (
                  <form
                    onSubmit={handleClaim}
                    className="rounded-lg bg-gray-50 p-5"
                  >
                    <h2 className="mb-4 text-xl font-semibold">
                      Why is this your item?
                    </h2>

                    <textarea
                      value={claimMessage}
                      onChange={(e) =>
                        setClaimMessage(e.target.value)
                      }
                      required
                      rows="5"
                      placeholder="Provide details to verify your claim..."
                      className="mb-4 w-full rounded-lg border p-3"
                    />

                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-5 py-2 text-white"
                    >
                      Submit Claim
                    </button>
                  </form>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default ItemDetails;