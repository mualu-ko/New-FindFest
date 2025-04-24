import React, { useState } from "react";
import axios from "axios";

const CloudinaryUploadButton = ({
  onUpload,
  folder = "profile_pics",
  label = "Upload Image",
}) => {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
    }
  };

  const handleUpload = async () => {
    if (!image) {
      alert("Please select an image first.");
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/cloudinary/generate-signature`, {
        folder,
      });

      const { signature, timestamp, cloudName, apiKey } = data;

      if (!cloudName || !signature || !timestamp) {
        console.error("Missing Cloudinary configuration data.");
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", image);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const uploadResponse = await axios.post(cloudinaryUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadResponse.data.secure_url) {
        onUpload(uploadResponse.data.secure_url); // Send back URL to parent
      } else {
        alert("Upload failed.");
      }
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      <button
        onClick={handleUpload}
        disabled={isLoading || !image}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow"
      >
        {isLoading ? "Uploading..." : label}
      </button>

      {previewUrl && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-1">Image Preview:</p>
          <img src={previewUrl} alt="Preview" className="image-preview" />
        </div>
      )}

      {isLoading && <p>Uploading image...</p>}
    </div>
  );
};

export default CloudinaryUploadButton;
