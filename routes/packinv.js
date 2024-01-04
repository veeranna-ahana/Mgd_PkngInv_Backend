const packinvRouter = require("express").Router();
var createError = require("http-errors");

const {
  setupQuery,
  qtnQuery,
  misQueryMod,
  mtrlQueryMod,
} = require("../helpers/dbconn");

packinvRouter.post(`/getpackingschedules`, async (req, res, next) => {
  try {
    let intype = req.body.instype;
    let ccode = req.body.ccode;
    console.log(intype);

    misQueryMod(
      `SELECT o.* FROM magodmis.orderschedule o
        WHERE Not(o.Schedule_Status like 'Created' or o.Schedule_Status like 'Dispatched' 
        or o.Schedule_Status like 'Closed' OR o.Schedule_Status like 'Cancelled' OR o.Schedule_Status like 'Ready'
         OR o.Schedule_Status like 'Suspended'  )  AND o.ScheduleType not like 'Combined'  
        AND o.Type = '${intype}'  AND o.Cust_code= '${ccode}' ORDER BY o.ScheduleDate desc`,
      async (err, data) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        }
        console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

packinvRouter.post(`/getpackschdetails`, async (req, res, next) => {
  try {
    let schid = req.body.scheduleid;

    misQueryMod(
      `SELECT o.*,c.cust_name FROM magodmis.orderschedule o, magodmis.cust_data c 
           WHERE o.ScheduleId = '${schid}' AND c.Cust_code=o.Cust_Code`,
      async (err, data) => {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        }
        console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

packinvRouter.post(`/getexnotifications`, async (req, res, next) => {
  try {
    // let schid = req.body.scheduleid;

    setupQuery(`SELECT * FROM magod_setup.exnotifications`, async (data) => {
      console.log(data);
      res.send(data);
    });
  } catch (error) {
    next(error);
  }
});

packinvRouter.post(`/getpckscheduledetails`, async (req, res, next) => {
  try {
    let schdetsid = req.body.scheduleid;

    setupQuery(
      `SELECT o.*,if (a.InDraftPn is null,0,a.InDraftPn) as InDraftPn FROM magodmis.orderscheduledetails o LEFT JOIN 
        (SELECT  d.ScheduleId, sum(d1.Qty) as InDraftPN, d1.OrderSchDetailsID
        FROM magodmis.draft_dc_inv_register d left join magodmis.draft_dc_inv_details d1 on  d1.DC_Inv_No = d.DC_Inv_No
        WHERE d.DCStatus='Draft'  AND d.ScheduleId ='${schdetsid}' AND d1.OrderSchDetailsID is not null 
        GROUP BY d1.OrderSchDetailsID) as a on a.OrderSchDetailsID=o.SchDetailsID WHERE o.ScheduleId ='${schdetsid}'`,
      async (data) => {
        console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = packinvRouter;
