const productionRouter = require("express").Router();
var createError = require('http-errors')

const { misQueryMod, setupQuery, misQuery, mchQueryMod } = require('../helpers/dbconn');
const { createFolder } = require('../helpers/folderhelper');


productionRouter.post(`/getprodschlistdetails`, async (req, res, next) => {
    try {
        let type = req.body.schtype;
        misQueryMod(`SELECT o.*,c.Cust_name FROM magodmis.orderschedule o 
        left outer join  magodmis.cust_data c on c.Cust_Code = o.Cust_Code
        WHERE (o.Schedule_Status='Tasked' OR o.Schedule_Status='Programmed' OR o.Schedule_Status='Production' 
        OR o.Schedule_Status='Processing' OR o.Schedule_Status='Completed') AND o.Type='${type}' 
        ORDER BY o.Delivery_date `, (err, prodschdata) => {
            console.log(prodschdata)
            res.send(prodschdata)
        })
    } catch (error) {
        next(error)
    }
});

productionRouter.post(`/getncprogramlistdata`, async (req, res, next) => {
    try {
        let nctaskid = req.body.Nctaskid;
        misQueryMod(`SELECT * FROM magodmis.ncprograms n WHERE n.NcTaskId='${nctaskid}'`, (err, prodschdata) => { 
            console.log(prodschdata)
            res.send(prodschdata)
        })
    } catch (error) {
        next(error)
    }
});

module.exports = productionRouter;