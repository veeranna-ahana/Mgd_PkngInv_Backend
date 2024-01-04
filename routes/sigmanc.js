const sigmancRouter = require("express").Router();
var createError = require('http-errors');

const { misQueryMod, setupQuery } = require('../helpers/dbconn');

sigmancRouter.post('/getorderschedule', async (req, res, next) => {
    try {
        console.log(req.body.SchStatus);
        let schstats = req.body.SchStatus;
        if (schstats == "Production") {
            misQueryMod(`SELECT c.dwgloc,c.cust_name ,o.Order_No,o.OrdSchNo,o.PO, 
                    o.ScheduleDate, o.Delivery_Date, o.ScheduleID,o.Schedule_Status,o.ScheduleType, 
                    o.Special_Instructions,o.cust_Code FROM magodmis.orderschedule o, magodmis.Cust_data c 
                    WHERE  o.cust_code=c.cust_code AND o.Type='Profile' AND (o.Schedule_Status='Tasked' or 
                    o.Schedule_Status='Processing' or o.Schedule_Status='Programmed' 
                    or o.Schedule_Status='Production')`, (err, data) => {
                res.send(data)
            });
        }
        else if (schstats == "Tasked") {
            misQueryMod(`SELECT c.dwgloc,c.cust_name ,o.Order_No,o.OrdSchNo,o.PO, 
                    o.ScheduleDate, o.Delivery_Date, o.ScheduleID,o.Schedule_Status,o.ScheduleType, 
                    o.Special_Instructions,o.cust_Code FROM magodmis.orderschedule o, magodmis.Cust_data c 
                    WHERE  o.cust_code=c.cust_code AND o.Type='Profile' AND o.Schedule_Status='Tasked'`, (err, data) => {
                res.send(data)
            });
        }
        else {
            misQueryMod(`SELECT c.dwgloc,c.cust_name,o.Order_No,o.OrdSchNo,o.PO,
            o.ScheduleDate, o.Delivery_Date,o.ScheduleID,o.Schedule_Status,o.ScheduleType, o.Special_Instructions,o.cust_Code
           FROM magodmis.orderschedule o, magodmis.Cust_data c 
            WHERE  o.cust_code=c.cust_code and o.OrdSchNo=@status AND o.Type='Profile'`, (err, data) => {
                res.send(data)
            });
        }
    } catch (error) {
        next(error)
    }
});

sigmancRouter.post('/getnctasklist', async (req, res, next) => {
    try {
        console.log(req.body.ScheduleId);
        let schid = req.body.ScheduleId;
        console.log(schid);
        misQueryMod(`SELECT * FROM magodmis.nc_task_list WHERE ScheduleID='${schid}'`, (err, data) => {
            console.log(err);
            console.log(data);
            res.send(data)
        });
    } catch (error) {
        next(error)
    }
});


sigmancRouter.post('/getnctaskparts', async (req, res, next) => {
    try {
        console.log(req.body.ScheduleId);
        let schid = req.body.ScheduleId;
        console.log(schid);
        misQueryMod(`SELECT t.*,n.Mprocess,n.mtrl_code FROM magodmis.task_partslist t,magodmis.nc_task_list n 
            WHERE  t.TaskNo=n.taskno And  n.ScheduleID='${schid}'`, (err, data) => {
            console.log(err);
            console.log(data);
            res.send(data)
        });
    } catch (error) {
        next(error)
    }
});


sigmancRouter.post('/getprogramlistdata', async (req, res, next) => {
    try {
        console.log(req.body.ScheduleId);
        let schid = req.body.ScheduleId;
        console.log(schid);
        misQueryMod(`SELECT n.* FROM magodmis.ncprograms n, magodmis.nc_task_list t 
        WHERE n.TaskNo=t.TaskNo AND t.ScheduleID='${schid}'`, (err, data) => {
            console.log(err);
            console.log(data);
            res.send(data)
        });
    } catch (error) {
        next(error)
    }
});


sigmancRouter.post('/updateprogramstatus', async (req, res, next) => {
    try {
        console.log("updateprogramstatus");
        console.log(req.body);
        let NCid = req.body.Ncid;
        let ordsch = req.body.Ordscheduleid;
        console.log(NCid);
        misQueryMod(`update magodmis.ncprograms set PStatus='Mtrl Issue' where Ncid = '${NCid}'`, (err, data) => {
            console.log(err);
            console.log(data);
           
        });
        misQueryMod(`SELECT n.* FROM magodmis.ncprograms n, magodmis.nc_task_list t 
            WHERE n.TaskNo=t.TaskNo AND t.ScheduleID='${ordsch}'`,(err,tdata) => {
                console.log(err);
                console.log(tdata);
                res.send(tdata)
            });

            // misQueryMod(`SELECT n.* FROM magodmis.ncprograms n, magodmis.nc_task_list t 
            // WHERE n.TaskNo=t.TaskNo AND n.Ncid = '${NCid}'`,(err,tdata) => {
            //     console.log(err);
            //     console.log(tdata);
            //     res.send(tdata)
            // });
    } catch (error) {
        next(error)
    }
});

sigmancRouter.post('/getmtrlavailability', async (req, res, next) => {
    try {
        console.log(req.body);
        let ccode = req.body.ccode;
        let mtrlcode = req.body.mtrl;
        console.log(ccode);
        misQueryMod(`SELECT  m.DynamicPara1 as Length, m.DynamicPara2 as Width,
        count( m.MtrlStockID) as stockQty FROM magodmis.mtrlstocklist m 
        WHERE m.Cust_Code='${ccode}' AND m.Mtrl_Code='${mtrlcode}' AND m.Locked=0 AND m.Scrap=0 
        GROUP BY m.Mtrl_Code, m.Cust_Code, m.DynamicPara1, m.DynamicPara2`, (err, data) => {
            console.log(err);
            console.log(data);
            res.send(data)
        });
    } catch (error) {
        next(error)
    }
});
module.exports = sigmancRouter;