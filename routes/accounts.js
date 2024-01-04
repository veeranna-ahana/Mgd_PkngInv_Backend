const accountsRouter = require("express").Router();
var createError = require('http-errors');
const req = require("express/lib/request");
const { misQuery, setupQuery, misQueryMod } = require('../helpers/dbconn');
const { logger } = require("../helpers/logger");

accountsRouter.post('/salesinvoices', async (req, res, next) => {
    console.log("Accounts")
    console.log(req.body.reportdate);
    const repdate = req.body.reportdate;
    try {
        misQueryMod(`SELECT d.*, m.UnitName,d.Dc_Inv_No as Unit_UId,d.Sync_HOId  as UpDated, 
        SUM(d1.JW_Rate * d1.Qty) as JwValue , Sum(d1.Mtrl_rate * d1.Qty) as MaterialValue 
        FROM magodmis.draft_dc_inv_register d, magod_setup.magodlaser_units m,magodmis.draft_dc_inv_details d1 
        WHERE m.Current AND  d.Dc_Inv_No= d1.Dc_Inv_No  AND d.Inv_Date='${repdate}'
        GROUP BY d.Dc_Inv_No ORDER BY d.Inv_no`, (err, data) => {
            if (err) logger.error(err);
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

// Tax Summary

accountsRouter.post('/taxsummary', async (req, res, next) => {
    console.log("Accounts")
    const repdate = req.body.reportdate;
    try {
        misQueryMod(`SELECT d1.DC_InvType as InvoiceType,if( d1.TaxAmount >0,1,0) as WithTax, d.Tax_Name as TaxName,
        d.TaxPercent as TaxPercent,Sum(d.TaxableAmount) as  TaxableAmount,  if( Sum(d.TaxAmt) is null,0, Sum(d.TaxAmt)) as TaxAmount, sum(d1.Net_Total) as InvoiceValue 
        FROM magodmis.draft_dc_inv_register d1 left join magodmis.dc_inv_taxtable d 
        ON d.Dc_inv_No=d1.Dc_inv_No WHERE d1.Inv_Date='${repdate}'
        GROUP BY d1.DC_InvType,WithTax, d.Tax_Name, d.TaxPercent`, (err, data) => {
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

// Payment Receipts

accountsRouter.post('/paymentreceipts', async (req, res, next) => {
    const repdate = req.body.reportdate;
    try {
        misQueryMod(`SELECT p.*,p.RecdPVID as Unit_UId,p.Sync_HOId  as UpDated,
        m.UnitName FROM magodmis.payment_recd_voucher_register p, magod_setup.magodlaser_units m
        WHERE(p.Recd_PV_Date = '${repdate}' And p.Recd_PVNo <> 'Draft') AND m.Current
        ORDER by p.recd_pvno;`, (err, data) => {
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});


// Payment Receipts Details

accountsRouter.post('/paymentrectdetails', async (req, res, next) => {
    const repdate = req.body.reportdate;
    try {
        misQueryMod(`SELECT p.* ,  m.UnitName,p.PVSrlID  as Unit_UId,p.Sync_HOId  as UpDated
        FROM magodmis.payment_recd_voucher_details p, magodmis.payment_recd_voucher_register r, magod_setup.magodlaser_units m  
        where (r.recd_pv_date = '${repdate}' And r.Recd_PVNo <> 'Draft')
        and p.dc_inv_no <>0  and p.receive_now>0  AND r.RecdPVID=p.RecdPVID  AND m.Current`, (err, data) => {
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

// Production Summary

accountsRouter.post('/prdsummary', async (req, res, next) => {
    const repdate = req.body.reportdate;
    try {
        misQueryMod(`SELECT d1.DC_InvType as InvoiceType,if( d1.TaxAmount >0,1,0) as WithTax, d1.ExNotNo as Ex_Not_no,
        d.Material, d.Excise_CL_no,Sum( d.TotQty) as TotalQty, sum(d.TotAmount) as TotalValue,
        sum(d.SrlWt) as TotalWeight FROM magodmis.draft_dc_inv_register d1 left join magodmis.dc_inv_summary d 
        ON d.Dc_inv_No=d1.Dc_inv_No WHERE d1.Inv_Date= '${repdate}'
        GROUP BY d1.DC_InvType,WithTax,d1.ExNotNo, d.Material, d.Excise_CL_no `, (err, data) => {
            console.log(data)
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

module.exports = accountsRouter;
