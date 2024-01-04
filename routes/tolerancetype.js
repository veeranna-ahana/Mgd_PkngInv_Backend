const tolerancetypeRouter = require("express").Router();
var createError = require('http-errors');

const { setupQuery } = require('../helpers/dbconn');

tolerancetypeRouter.get('/alltolerancetypes', async (req, res, next) => {
    try {
        setupQuery("Select * from magod_setup.tolerancetable order by ToleranceType asc", (data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
})



module.exports = tolerancetypeRouter;