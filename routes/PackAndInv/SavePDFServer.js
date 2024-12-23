// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const { log } = require("console");

// const savePDF = express.Router();
// // require("dotenv").config({ path: "./vars/.env" });
// // Middleware to parse form data before multer handles the request
// savePDF.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// // console.log(" process.env.FILE_SERVER_PDF_PATH", process.env.FILE_SERVER_PATH);

// // Ensure upload directory exists
// const uploadFolder =
//   process.env.FILE_SERVER_PATH || path.join(__dirname, "uploads");
// //   process.env.FILE_SERVER_PATH;
// if (!fs.existsSync(uploadFolder)) {
//   fs.mkdirSync(uploadFolder, { recursive: true });
// }

// // Function to format the current date and time
// const getFormattedDateTime = () => {
//   const now = new Date();
//   const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
//   const time = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS
//   return `${date}_${time}`;
// };

// var adjustment = "";

// // API endpoint to save the PDF
// savePDF.post(
//   "/save-pdf",
//   (req, res, next) => {
//     console.log("req.body---1", req.body);

//     // Dynamically configure storage
//     const storage = multer.diskStorage({
//       destination: (req, file, cb) => {
//         cb(null, uploadFolder); // Save files in the uploads directory
//       },
//       filename: (req, file, cb) => {
//         // console.log("req.file", req.file);

//         const adjustment = req.body.adjustment || "Default_Name"; // Use req.body.adjustment
//         const dateTime = getFormattedDateTime(); // Get current date and time
//         const ext = path.extname(file.originalname); // Retain the original file extension
//         cb(null, `${adjustment}_${dateTime}${ext}`); // Generate the file name
//       },
//     });

//     // Configure upload with dynamic storage
//     const upload = multer({ storage }).single("file");

//     // Execute upload middleware
//     upload(req, res, (err) => {
//       console.log("req.body---2", req.body);

//       if (err) {
//         return res
//           .status(500)
//           .send({ message: "File upload failed", error: err });
//       }
//       next(); // Proceed to the next middleware
//     });
//   },
//   (req, res) => {
//     console.log("req.body---3", req.body);

//     if (!req.file) {
//       return res.status(400).send("No file uploaded.");
//     }

//     console.log("Adjustment Name11111:", req.body.adjustment); // Log the adjustment name
//     var adjustment = req.body.adjustment;
//     console.log(`File saved to: ${req.file.path}`); // Log the file path

//     res.status(200).send({
//       message: "PDF saved successfully!",
//       filePath: req.file.path,
//     });
//   }
// );

// module.exports = savePDF;


const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const savePDF = express.Router();

// Global variable to store the adjustment name
let globalAdjustmentName = "Default_Name";

// Ensure upload directory exists
const uploadFolder =
  process.env.FILE_SERVER_PATH || path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// Function to format the current date and time
const getFormattedDateTime = () => {
  const now = new Date();
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS
  return `${date}_${time}`;
};

// API to store adjustment name globally
savePDF.post("/set-adjustment-name", (req, res) => {
  const { adjustment } = req.body;

  if (!adjustment) {
    return res.status(400).send({ message: "Adjustment name is required." });
  }

  globalAdjustmentName = adjustment;
  console.log("Global adjustment name set to:", globalAdjustmentName);
  res.status(200).send({ message: "Adjustment name saved successfully." });
});

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder); // Save files in the uploads directory
  },
  filename: (req, file, cb) => {
    const dateTime = getFormattedDateTime(); // Get current date and time
    const ext = path.extname(file.originalname); // Retain the original file extension
    cb(null, `${globalAdjustmentName}_${dateTime}${ext}`); // Use global adjustment name
  },
});
const upload = multer({ storage }).single("file");

// API endpoint to save the PDF
savePDF.post("/save-pdf", (req, res) => {
  // Middleware to handle the file upload
  upload(req, res, (err) => {
    if (err) {
      return res
        .status(500)
        .send({ message: "File upload failed", error: err });
    }

    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    console.log("Adjustment Name:", globalAdjustmentName); // Log the adjustment name
    console.log(`File saved to: ${req.file.path}`); // Log the file path

    res.status(200).send({
      message: "PDF saved successfully!",
      filePath: req.file.path,
    });
  });
});

module.exports = savePDF;
