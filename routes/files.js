const fileRouter = require("express").Router();
var createError = require('http-errors')
const fs = require('fs');
const multer = require("multer");

const basefolder='C:\\Magod\\Jigani';

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/")
    },

    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage: storage });

fileRouter.post('/uploaddxf', upload.array("files"), function (req, res) {
    res.json({ message: "File uploaded successfully", files: req.files });
});

fileRouter.post('/getdxf', async (req, res) => {
    const { dxfname } = req.body;
    console.log(dxfname);
    let content = fs.readFileSync("uploads/" + dxfname);
    res.send(content);
});

fileRouter.post('/getdxfnames', async (req, res) => {
    console.log(req);
 //   const quoteno = req.body.quoteno;
    const path = basefolder + req.body.filepath;
    let content = fs.readdirSync(path);
    res.send({ files: content })
});
module.exports = fileRouter;