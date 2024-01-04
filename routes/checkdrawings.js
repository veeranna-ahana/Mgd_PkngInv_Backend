const checkdrawingsRouter = require("express").Router();
var createError = require("http-errors");
const { checkdrawings } = require("../helpers/folderhelper");

checkdrawingsRouter.post("/chkdrawings", async (req, res, next) => {
  try {
    const { qtnNo } = req.body;
    checkdrawings(qtnNo, (ins) => {
      res.send({ exists: ins });
    });
  } catch (error) {
    next(error);
  }
});

// Select * from magodmis.cust_data

module.exports = checkdrawingsRouter;
