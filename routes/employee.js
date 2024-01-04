 const employeeRouter = require("express").Router();
var createError = require('http-errors');
const { createFolder } = require('../helpers/folderhelper');
const { misQuery, setupQuery, misQueryMod } = require('../helpers/dbconn');

employeeRouter.get('/allsalesemployees', async (req, res, next) => {
    try {
        misQueryMod("SELECT EmployeeID,Employee_Name FROM magodmis.employeesdb where Sales = '-1'", (err,data) => {
            if (err) return res.send({ status: 'error', error: err });
            console.log(err)
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});
module.exports = employeeRouter;