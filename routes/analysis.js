const analysisRouter = require("express").Router();
var createError = require('http-errors');

const { misQuery, setupQuery, misQueryMod } = require('../helpers/dbconn');

analysisRouter.post('/analysisinvoices', async (req, res, next) => {
    const invdate = req.body.invdate;
    try {
        misQueryMod(`SELECT d.*
        FROM magodmis.draft_dc_inv_register d`, (err,data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

module.exports = analysisRouter;