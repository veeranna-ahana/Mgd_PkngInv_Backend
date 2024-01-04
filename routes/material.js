const materialRouter = require("express").Router();
var createError = require('http-errors');

const { misQueryMod, setupQuery } = require('../helpers/dbconn');

materialRouter.get('/allmaterials', async (req, res, next) => {
    try {
        misQueryMod("Select * from magodmis.mtrl_data order by Mtrl_Code asc", (err,data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

materialRouter.get('/getmtrldetails', async (req, res, next) => {
    try {
        console.log("mtrldetails")
        misQueryMod("Select Concat(Shape,' ',MtrlGradeID) as Material from magodmis.mtrl_data where shape='Units' order by MtrlGradeID asc", (err,data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

materialRouter.get('/getmtrllocation', async (req, res, next) => {
    try {
        setupQuery(`SELECT * FROM magod_setup.material_location_list where StorageType="Units"`, (data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});


module.exports = materialRouter