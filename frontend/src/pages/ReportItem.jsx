import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, {
  ALLOWED_IMAGE_TYPES,
  getImageValidationError,
} from "../services/api";

function ReportItem() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "lost",
    category: "",
    location: "",
    date: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = getImageValidationError(file);
    if (validationError) {
      setImageFile(null);
      setPreview("");
      setImageError(validationError);
      setError(validationError);
      e.target.value = "";
      return;
    }

    setImageError("");
    setError("");
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (imageError) return;

    try {
      setLoading(true);
      setError("");

      const data = new FormData();
      Object.keys(form).forEach((key) => data.append(key, form[key]));
      if (imageFile) data.append("image", imageFile);

      await api.post("/items", data);

      alert("Item reported successfully!");
      navigate("/items");
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-bold">Report Lost / Found Item</h1>

      {error && (
        <div className="mb-5 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-2 block font-medium">Item Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Example: Black Wallet"
            required
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the item..."
            required
            rows="5"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full rounded-lg border px-4 py-3"
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-medium">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-4 py-3"
          >
            <option value="">Select Category</option>
            <option value="Electronics">Electronics</option>
            <option value="Documents">Documents</option>
            <option value="Clothing">Clothing</option>
            <option value="Accessories">Accessories</option>
            <option value="Books">Books</option>
            <option value="Keys">Keys</option>
            <option value="Bags">Bags</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-medium">Location</label>
          <select
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-4 py-3"
          >
            <option value="">Select Location</option>
            <option value="Library">Library</option>
            <option value="Canteen">Canteen</option>
            <option value="Hostel">Hostel</option>
            <option value="Main Gate">Main Gate</option>
            <option value="Academic Block">Academic Block</option>
            <option value="Sports Complex">Sports Complex</option>
            <option value="Parking">Parking</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-medium">Lost / Found Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Image (optional)</label>
          <input
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleImage}
            className="w-full rounded-lg border px-4 py-3"
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-3 h-40 rounded-lg object-cover"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Report Item"}
        </button>
      </form>
    </div>
  );
}

export default ReportItem;