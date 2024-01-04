const mtrlsourceRouter = require("express").Router();
var createError = require('http-errors');
//const { createFolder } = require('../helpers/folderhelper');
const { setupQuery } = require('../helpers/dbconn');

mtrlsourceRouter.post('/allmtrlsources', async (req, res, next) => {
    try {
        setupQuery("SELECT * FROM magod_setup.mtrlsource order by MtrlSource asc", (data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

module.exports = mtrlsourceRouter;