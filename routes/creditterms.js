const credittermsRouter = require("express").Router();
var createError = require('http-errors');
//const { createFolder } = require('../helpers/folderhelper');
const { setupQuery } = require('../helpers/dbconn');

credittermsRouter.post('/allcreditterms', async (req, res, next) => {
    try {
        setupQuery("SELECT * FROM magod_setup.paymentterms order by PaymentTerm asc", (data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

module.exports = credittermsRouter;