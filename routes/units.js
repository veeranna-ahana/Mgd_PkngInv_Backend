const unitRouter = require("express").Router();
var createError = require("http-errors");

const { setupQuery } = require("../helpers/dbconn");

unitRouter.post("/allunits", async (req, res, next) => {
  try {
    setupQuery(
      "SELECT UnitID,UnitName,Unit_Address FROM magod_setup.magodlaser_units where Current = '1'",
      (data) => {
        console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

unitRouter.post("/unit", async (req, res, next) => {
  try {
    const { id } = req.body;
    setupQuery(
      `Select * from magod_setup.unit_info WHERE UnitId = '${id}'`,
      (data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = unitRouter;
