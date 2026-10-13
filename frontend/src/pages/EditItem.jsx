import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api, {
  ALLOWED_IMAGE_TYPES,
  getImageValidationError,
} from "../services/api";

function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await api.get(`/items/${id}`);
      setForm(response.data);
      setPreview(response.data.image || "");
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = getImageValidationError(file);
    if (validationError) {
      setImageFile(null);
      setImageError(validationError);
      e.target.value = "";
      return;
    }

    setImageError("");
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (imageError) return;

    try {
      const data = new FormData();
      data.append("title", form.title);
      data.append("description", form.description);
      data.append("type", form.type);
      data.append("category", form.category);
      data.append("location", form.location);
      data.append("date", form.date);
      if (imageFile) data.append("image", imageFile);

      await api.put(`/items/${id}`, data);

      alert("Item updated successfully");
      navigate(`/items/${id}`);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update item");
    }
  };

  if (!form) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-bold">Edit Report</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border p-6"
      >
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full rounded-lg border p-3"
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows="5"
          className="w-full rounded-lg border p-3"
        />

        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full rounded-lg border p-3"
        >
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full rounded-lg border p-3"
        >
          <option value="Electronics">Electronics</option>
          <option value="Documents">Documents</option>
          <option value="Clothing">Clothing</option>
          <option value="Accessories">Accessories</option>
          <option value="Books">Books</option>
          <option value="Keys">Keys</option>
          <option value="Bags">Bags</option>
          <option value="Other">Other</option>
        </select>

        <select
          name="location"
          value={form.location}
          onChange={handleChange}
          className="w-full rounded-lg border p-3"
        >
          <option value="Library">Library</option>
          <option value="Canteen">Canteen</option>
          <option value="Hostel">Hostel</option>
          <option value="Main Gate">Main Gate</option>
          <option value="Academic Block">Academic Block</option>
          <option value="Sports Complex">Sports Complex</option>
          <option value="Parking">Parking</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="date"
          name="date"
          value={form.date?.slice(0, 10)}
          onChange={handleChange}
          className="w-full rounded-lg border p-3"
        />

        <div>
          <label className="mb-2 block font-medium">
            Change image (optional)
          </label>
          <input
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleImage}
            className="w-full rounded-lg border p-3"
          />
          {imageError && (
            <p className="mt-2 text-sm text-red-600">{imageError}</p>
          )}
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
          className="w-full rounded-lg bg-blue-600 p-3 text-white"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}

export default EditItem;