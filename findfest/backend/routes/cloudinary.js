// Backend (Express.js)

const express = require("express");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();  // Ensure .env variables are loaded

// Log the environment variables to ensure they are correct
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET);

// Set up Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

// Endpoint to generate the Cloudinary signature
router.post("/generate-signature", async (req, res) => {
  try {
    const { folder } = req.body; // Folder name from the request body (optional)
    const timestamp = Math.round(new Date().getTime() / 1000); // Get the timestamp

    // Default folder to "profile_pics" if no folder is provided
    const uploadFolder = folder || "profile_pics"; 

    // Prepare parameters to sign
    const paramsToSign = {
      timestamp,
      folder: uploadFolder,
    };

    // Generate the Cloudinary signature
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

    // Return the response to the frontend
    res.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,  // Ensure cloudName is included in the response
      folder: uploadFolder,
    });
  } catch (error) {
    console.error("Error generating Cloudinary signature:", error);
    res.status(500).json({ message: "Error generating signature", error: error.message });
  }
});

module.exports = router;
