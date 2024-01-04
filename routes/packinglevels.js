const packinglevelsRouter = require("express").Router();
var createError = require('http-errors');

const { setupQuery } = require('../helpers/dbconn');

packinglevelsRouter.get('/allpackinglevels', async (req, res, next) => {
    try {
        setupQuery("Select * from magod_setup.packinglevels order by PkngLevel asc", (data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
})



module.exports = packinglevelsRouter;