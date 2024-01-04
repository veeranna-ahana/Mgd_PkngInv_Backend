const salesexeclistRouter = require("express").Router();
var createError = require('http-errors');

const { slsQueryMod } = require('../helpers/dbconn');

salesexeclistRouter.post('/allsalesexeclists', async (req, res, next) => {
    try {
        slsQueryMod("SELECT * FROM magod_sales.sales_execlist order by Name asc", (err, data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

salesexeclistRouter.post('/indisalesexeclists', async (req, res, next) => {
    try {
        let salesid = req.body.salesContact;
        slsQueryMod(`SELECT * FROM magod_sales.sales_execlist where ID = '${salesid}' order by Name asc`, (err, data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
})



module.exports = salesexeclistRouter