const orderRouter = require("express").Router();
var createError = require('http-errors')

const { misQueryMod, setupQuery, misQuery, mchQueryMod } = require('../helpers/dbconn');
const { createFolder } = require('../helpers/folderhelper');

orderRouter.post(`/createorder`, async (req, res, next) => {
    try {
        console.log("Creating new order");
        // const orddate = new Date().toString().replaceAll("T", " ").split(".")[0];
        let zzz = new Date();
        const orddate = zzz.getFullYear() + "-" + (zzz.getMonth() + 1).toString().padStart(2, '0') + "-" + zzz.getDate() + " " + zzz.getHours() + ":" + zzz.getMinutes() + ":" + zzz.getSeconds();
        const ordertype = req.body.ordertype;
        const purchaseorder = req.body.purchaseOrder;
        const qtnno = req.body.qtnno;
        const deliverydate = req.body.deliverydate;
        const paymentterms = req.body.paymentterms;
        const salesContact = req.body.salesContact;
        const ccode = req.body.custcode;
        const customer = req.body.customer;
        const CustomerContact = req.body.CustomerContact;
        const receivedby = req.body.receivedby;
        const RecordedBy = req.body.RecordedBy;
        const gstin = req.body.gstin;
        const DealingEngineer = req.body.DealingEngineer;
        const DeliveryMode = req.body.DeliveryMode;
        const billingAddress = req.body.billingAddress;
        const SpecialInstructions = req.body.SpecialInstructions;
        const BillingState = req.body.BillingState;
        const MagodDelivery = req.body.MagodDelivery;
        const shippingAddress = req.body.shippingAddress;
        const GSTTaxState = req.body.GSTTaxState;
        const Transportcharges = req.body.Transportcharges;
        const billingstateId = '00';
        const DelStateId = '00';


        // setupQuery(`SELECT *  FROM magod_setup.magod_runningno WHERE SrlType='Order' and (curdate() >= EffectiveFrom_date and curdate() <= Reset_date) and UnitName='Jigani'  
        // ORDER BY Id DESC LIMIT 1`, async (runningno) => {
        setupQuery(`SELECT *  FROM magod_setup.magod_runningno WHERE SrlType='Order' and UnitName='Jigani'  
            ORDER BY Id DESC LIMIT 1`, async (runningno) => {
            // let ordno = new Date().getFullYear().toString() + "_" + (new Date().getMonth() + 1).toString().padStart(2, '0') + '_' + (parseInt(runningno[0]["Running_No"]) + 1).toString().padStart(3, '0')
            let ordno = new Date().getFullYear().toString().substr(-2) + (parseInt(runningno[0]["Running_No"]) + 1).toString().padStart(3, '0')
            await createFolder('Order', ordno, ''); // To Create folder at server side

            misQuery(`INSERT INTO magodmis.order_list(order_no,order_date ,cust_code ,contact_name ,Type, delivery_date , purchase_order ,
                order_received_by, salescontact, recordedby, dealing_engineer , order_status , special_instructions , payment , 
                ordervalue , materialvalue , billing_address, BillingStateId, delivery , del_place ,DelStateId, del_mode , 
                tptcharges , order_type , register ,qtnno ) VALUES ('${ordno}','${orddate}','${ccode}','${CustomerContact}','${ordertype}','${deliverydate}','${purchaseorder}',
                '${receivedby}','${salesContact}','${RecordedBy}','${DealingEngineer}','Created','${SpecialInstructions}','${paymentterms}',
                '${0}','${0}','${billingAddress}','${billingstateId}','${0}','${GSTTaxState}','${DelStateId}','${DeliveryMode}',
                '${Transportcharges}','${ordertype}','${0}','${qtnno}')`, (ins) => {


                console.log(ins)
                if (ins.affectedRows == 1) {
                    setupQuery(`UPDATE magod_setup.magod_runningno SET Running_No = Running_No + 1 WHERE SrlType='Order' And Id = ${runningno[0]["Id"]}`, async (updatedrunning) => {
                        console.log(`Updated running No ${JSON.stringify(updatedrunning)}`)
                    })
                }
            })

            res.send({ orderno: ordno })
        });


        //let month = mon[new Date().getMonth()]


        // to update table runningno = runningno + 1

    } catch (error) {
        next(error)
    }
});


orderRouter.post(`/getorderdata`, async (req, res, next) => {
    try {
        console.log("Getting order data");
        const orderno = req.body.ordno;
        const ordtype = req.body.ordtype;
        console.log(orderno, ordtype);
        misQueryMod(`SELECT ord.*,cust.Cust_name FROM magodmis.order_list ord 
        left outer join magodmis.cust_data cust on cust.Cust_code = ord.Cust_Code
        WHERE order_no = '${orderno}' and type='${ordtype}'`, (err, orderdata) => {
            console.log(orderdata)
            res.send(orderdata)
        })
    } catch (error) {
        next(error)
    }
});

orderRouter.get(`/getcombinedschdata`, async (req, res, next) => {
    try {

        misQueryMod(`SELECT  n.Mtrl_Code, n.Operation,sum( n.NoOfDwgs) as NoOfDwgs, sum(n.TotalParts) as TotalParts 
        FROM magodmis.nc_task_list n,machine_data.operationslist o,machine_data.profile_cuttingoperationslist p 
        WHERE n.CustMtrl='Magod' AND n.TStatus='Created' AND o.OperationID=p.OperationId
        AND o.Operation=n.Operation
        GROUP BY  n.Mtrl_Code, n.Operation ORDER BY n.Mtrl_Code, n.Operation`, (err, cmbdschdata) => {
            console.log(cmbdschdata)
            res.send(cmbdschdata)
        })
    } catch (error) {
        next(error)
    }
});

orderRouter.post(`/getorderscheduledata`, async (req, res, next) => {
    try {
        let ccode = req.body.custcode;
        misQueryMod(`SELECT o.* FROM magodmis.orderschedule o WHERE  o.Schedule_Status ='Tasked'  AND o.Cust_Code='${ccode}' 
                    AND o.PO not like 'Combined' AND o.Type='Profile' AND o.ScheduleType= 'Job Work'`, (err, ordschdata) => {
            console.log(ordschdata)
            res.send(ordschdata)
        })
    } catch (error) {
        next(error)
    }
});
orderRouter.post(`/getselectedschdwgdata`, async (req, res, next) => {
    try {
        let scheduleid = req.body.schid;
        console.log(scheduleid);
        misQueryMod(`SELECT * FROM magodmis.orderscheduledetails WHERE  scheduleid ='${scheduleid}'`, (err, ordschdwgdata) => {
            console.log(ordschdwgdata)
            res.send(ordschdwgdata)
        })
    } catch (error) {
        next(error)
    }
});

orderRouter.post(`/getsalestasksdata`, async (req, res, next) => {
    try {
        //  let scheduleid = req.body.schid;
        //  console.log(scheduleid);
        misQueryMod(`SELECT    n.Mtrl_Code, n.Operation,sum( n.NoOfDwgs) as NoOfDwgs, sum(n.TotalParts) as TotalParts 
                    FROM magodmis.nc_task_list n,machine_data.operationslist o,machine_data.profile_cuttingoperationslist p 
                    WHERE n.CustMtrl='Magod' AND n.TStatus='Created' AND o.OperationID=p.OperationId
                    AND o.Operation=n.Operation
                    GROUP BY  n.Mtrl_Code, n.Operation ORDER BY n.Mtrl_Code, n.Operation`, (err, slstskdata) => {
            console.log(slstskdata)
            res.send(slstskdata)
        })
    } catch (error) {
        next(error)
    }
});
//Sureshj

orderRouter.post(`/getselectedsalestasklist`, async (req, res, next) => {
    try {
        console.log("Getting selected sales task list");
        let mtrlcode = req.body.mtrl;
        let opern = req.body.opertn;
        console.log(mtrlcode, opern);
        misQueryMod(`SELECT   n.Mtrl_Code, n.Operation,n.MProcess,@SalesTasksId as SalesTasksId,
        n.NcTaskId,n.ScheduleId,
        Left( n.TaskNo,9) as OrderSchNo, n.TaskNo, n.Cust_Code, n.NoOfDwgs, n.TotalParts,c.Cust_name
        FROM magodmis.nc_task_list n,magodmis.cust_data c,magodmis.orderschedule o
        WHERE n.CustMtrl='Magod' AND n.Mtrl_Code='${mtrlcode}' AND n.Operation='${opern}' 
        AND n.Cust_Code=c.Cust_Code AND n.TStatus='Created' AND n.ScheduleId=n.ScheduleId 
        AND Not( n.TaskNo  Like '99%' OR n.TaskNo  Like '88%' ) AND o.Schedule_Status='Tasked'`, (err, slstskdata) => {
            console.log(slstskdata)
            res.send(slstskdata)
        })
    } catch (error) {
        next(error)
    }
});


orderRouter.post(`/preparescheduledetails`, async (req, res, next) => {
    try {
        console.log("Preparing schedule details");
        let nctskid = req.body.nctaskid;
        misQueryMod(`SELECT n.NcTaskId, n.TaskNo, o.SchDetailsID, o.ScheduleId, o.Cust_Code, o.DwgName, o.Mtrl_Code,
o.MProcess, o.Mtrl_Source, o.InspLevel, o.QtyScheduled as QtyToNest, o.DwgStatus, o.Operation, o.Tolerance
FROM magodmis.orderscheduledetails o,magodmis.nc_task_list n WHERE  o.NcTaskId=n.NcTaskId AND n.NcTaskId='${nctskid}'`, (err, prepschdata) => {
            console.log(prepschdata)
            res.send(prepschdata)
        })
    } catch (error) {
        next(error)
    }
});



orderRouter.post(`/getorderdwgdata`, async (req, res, next) => {
    try {
        console.log("Getting order data");
        const orderno = req.body.ordno;
        misQueryMod(`SELECT * FROM magodmis.order_details WHERE order_no = '${orderno}'`, (err, orderdwgdetsdata) => {
            console.log(orderdwgdetsdata)
            res.send(orderdwgdetsdata)
        })
    } catch (error) {
        next(error)
    }
});


orderRouter.post(`/getorddetailsdata`, async (req, res, next) => {
    try {
        console.log("Getting order data");
        const orderno = req.body.ordno;
        misQueryMod(`SELECT * FROM magodmis.order_details WHERE order_no = '${orderno}'`, (err, orderdwgdetsdata) => {
            console.log(orderdwgdetsdata)
            res.send(orderdwgdetsdata)
        })
    } catch (error) {
        next(error)
    }
});

module.exports = orderRouter;