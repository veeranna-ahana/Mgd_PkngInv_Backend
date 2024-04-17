const PDFRouter = require("express").Router();
const {
  misQuery,
  setupQuery,
  setupQueryMod,
  misQueryMod,
} = require("../../helpers/dbconn");
const { logger } = require("../../helpers/logger");

PDFRouter.post("/getPDFData", async (req, res, next) => {
  try {
    setupQueryMod(
      `SELECT * FROM magod_setup.magodlaser_units`,
      (err, pdfData) => {
        if (err) {
          console.log("err", err);
        } else {
          //   console.log("pdfData", pdfData);

          res.send(pdfData);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = PDFRouter;
