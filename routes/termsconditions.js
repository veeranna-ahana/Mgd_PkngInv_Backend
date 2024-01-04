const termsconditionsRouter = require("express").Router();
var createError = require('http-errors');

const { qtnQuery } = require('../helpers/dbconn');

termsconditionsRouter.post('/alltermsconditions', async (req, res, next) => {
    try {
        qtnQuery("Select * from magodqtn.terms_and_conditions order by ID asc", (data) => {
           // console.log(data);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

// Select * from magodmis.cust_data

module.exports = termsconditionsRouter