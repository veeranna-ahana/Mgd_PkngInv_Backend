const inspectionRouter = require("express").Router();
var createError = require('http-errors');

const { setupQuery } = require('../helpers/dbconn');

inspectionRouter.get('/allinspectionlevels', async (req, res, next) => {
    try {
        setupQuery("Select * from magod_setup.insplevels order by InspLevel asc", (data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
})



module.exports = inspectionRouter;