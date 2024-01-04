const machineRouter = require("express").Router();
var createError = require('http-errors');

const { mchQueryMod } = require('../helpers/dbconn');

machineRouter.get('/allmachines', async (req, res, next) => {
    try {
        mchQueryMod("Select * from machine_data.machine_list order by Machine_srl asc", (err,data) => {
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

module.exports = machineRouter;