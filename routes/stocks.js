const stocksRouter = require("express").Router();
var createError = require('http-errors')

const { setupQuery, qtnQuery, misQueryMod,mtrlQueryMod } = require('../helpers/dbconn');

stocksRouter.post(`/getmtrlstocks`, async (req, res, next) => {
    try {
        //Mtrl_Stock 
        // misQueryMod(`SELECT m.Cust_Code,m.Mtrl_Code, m.DynamicPara1, m.DynamicPara2,
        // m.DynamicPara3, m.Locked, m.Scrap, m1.Material, count(m.MtrlStockID) as Qty, 
        //  Sum(m.Weight) as Weight, sum(m.ScrapWeight) as ScrapWeight 
        // FROM magodmis.mtrlstocklist m ,magodmis.mtrlgrades m1, magodmis.mtrl_data m2 
        // WHERE m.Cust_Code= '${ccode}' AND m.IV_No is  null AND m2.Mtrl_Code=m.Mtrl_Code
        // AND m1.MtrlGradeID =m2.MtrlGradeID
        // GROUP BY m.Mtrl_Code, m.DynamicPara1, m.DynamicPara2, m.Locked, m.Scrap 
        // ORDER BY m.Scrap Desc , m.Mtrl_Code`

        let ccode = req.body.ccode;
        console.log(ccode);

        misQueryMod(`SELECT m.Cust_Code,m.Mtrl_Code, m.DynamicPara1, m.DynamicPara2,
        m.DynamicPara3, m.Locked, m.Scrap, m1.Material, count(m.MtrlStockID) as Qty, 
         Sum(m.Weight) as Weight, sum(m.ScrapWeight) as ScrapWeight 
        FROM magodmis.mtrlstocklist m ,magodmis.mtrlgrades m1, magodmis.mtrl_data m2 
        WHERE m.Cust_Code= '${ccode}' AND m.IV_No is  null AND m2.Mtrl_Code=m.Mtrl_Code
        AND m1.MtrlGradeID =m2.MtrlGradeID
        GROUP BY m1.Material
        ORDER BY m.Scrap Desc , m.Mtrl_Code`, async (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            }
            console.log(data);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});


stocksRouter.post(`/getmtrlcodestocks`, async (req, res, next) => {
    try {
        let ccode = req.body.ccode;
        let mtrl = req.body.material;
        console.log(ccode);

        if (mtrl == null) {
            misQueryMod(`SELECT m.Cust_Code, m1.Material, count(m.MtrlStockID) as Qty, 
            Sum(m.Weight) as Weight, sum(m.ScrapWeight) as ScrapWeight 
            FROM magodmis.mtrlstocklist m,magodmis.mtrlgrades m1, magodmis.mtrl_data m2 
            WHERE m.Cust_Code= '${ccode}' AND m.IV_No is  null AND m2.Mtrl_Code=m.Mtrl_Code
            AND m1.MtrlGradeID=m2.MtrlGradeID GROUP BY m1.Material, m.Mtrl_Code
            ORDER BY m.Mtrl_Code`, async (err, data) => {
                if (err) {
                    console.log(err);
                    res.status(500).send(err);
                }
                console.log(data);
                res.send(data)
            })
        } else {
            misQueryMod(`SELECT m.Cust_Code, m1.Material,m.Mtrl_Code, count(m.MtrlStockID) as Qty, 
            Sum(m.Weight) as Weight, sum(m.ScrapWeight) as ScrapWeight 
            FROM magodmis.mtrlstocklist m,magodmis.mtrlgrades m1, magodmis.mtrl_data m2 
            WHERE m.Cust_Code= '${ccode}' AND m.IV_No is  null AND m2.Mtrl_Code=m.Mtrl_Code
            AND m1.MtrlGradeID=m2.MtrlGradeID And m1.Material='${mtrl}' GROUP BY m1.Material, m.Mtrl_Code
            ORDER BY m.Mtrl_Code`, async (err, data) => {
                if (err) {
                    console.log(err);
                    res.status(500).send(err);
                }
                console.log(data);
                res.send(data)
            })
        }
    } catch (error) {
        next(error)
    }
});


stocksRouter.post(`/getmtrlstocksdets`, async (req, res, next) => {
    try {
        let ccode = req.body.ccode;
        let mtrlcd = req.body.mtrlcode;
        console.log(ccode);

        if (mtrlcd == null) {
            misQueryMod(`SELECT m.Cust_Code,m.Mtrl_Code, m.DynamicPara1, m.DynamicPara2,
        m.DynamicPara3, m.Locked, m.Scrap, m1.Material, count(m.MtrlStockID) as Qty, 
         Sum(m.Weight) as Weight, sum(m.ScrapWeight) as ScrapWeight 
        FROM magodmis.mtrlstocklist m ,magodmis.mtrlgrades m1, magodmis.mtrl_data m2 
        WHERE m.Cust_Code= '${ccode}' AND m.IV_No is  null AND m2.Mtrl_Code=m.Mtrl_Code
        AND m1.MtrlGradeID =m2.MtrlGradeID 
        GROUP BY m1.Material
        ORDER BY m1.Material`, async (err, data) => {
                if (err) {
                    console.log(err);
                    res.status(500).send(err);
                }
                console.log(data);
                res.send(data)
            })
        } else {
            misQueryMod(`SELECT m.Cust_Code,m.Mtrl_Code, m.DynamicPara1, m.DynamicPara2,
        m.DynamicPara3, m.Locked, m.Scrap, m1.Material, count(m.MtrlStockID) as Qty, 
         Sum(m.Weight) as Weight, sum(m.ScrapWeight) as ScrapWeight 
        FROM magodmis.mtrlstocklist m ,magodmis.mtrlgrades m1, magodmis.mtrl_data m2 
        WHERE m.Cust_Code= '${ccode}' AND m.IV_No is  null AND m2.Mtrl_Code=m.Mtrl_Code
        AND m1.MtrlGradeID =m2.MtrlGradeID AND m.Mtrl_Code = '${mtrlcd}'
        GROUP BY m1.Material, m.Mtrl_Code
        ORDER BY m.Scrap Desc , m.Mtrl_Code`, async (err, data) => {
                if (err) {
                    console.log(err);
                    res.status(500).send(err);
                }
                console.log(data);
                res.send(data)
            })
        }
    } catch (error) {
        next(error)
    }
});

// Stock Arrivals

stocksRouter.post(`/getstockarrivalsummary`, async (req, res, next) => {
    try {
        let rvdate = req.body.rvdate;
        console.log(rvdate);

        misQueryMod(`SELECT  m.RV_No, m1.Material, sum(m1.TotalWeightCalculated) as TotalWeightCalculated,
        sum(m1.TotalWeight) as TotalWeight, m.CustDocuNo, m1.Srl
        FROM magodmis.material_receipt_register m, magodmis.mtrlreceiptdetails m1 
        WHERE m.RV_No <> 'Draft' AND m.Rv_date = '${rvdate}' AND m1.RvID = m.RvID
        AND m.Cust_Code = '0000' GROUP BY  m.RV_No, m1.Material`, async (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            }
            console.log(data);
            res.send(data)
        })

    } catch (error) {
        next(error)
    }
});

stocksRouter.post(`/getstockarrivalreceipts`, async (req, res, next) => {
    try {
        let rvdate = req.body.rvdate;
        console.log(rvdate);

        misQueryMod(`SELECT m1.Mtrl_Rv_id,m.Rv_date, m.RV_No, m1.Material, m1.TotalWeightCalculated,
        m1.TotalWeight, m.CustDocuNo, m1.Srl 
        FROM magodmis.material_receipt_register m,magodmis.mtrlreceiptdetails m1 
        WHERE m.RV_No<>'Draft' AND m.Rv_date = '${rvdate}' AND m1.RvID=m.RvID
        AND m.Cust_Code='0000'`, async (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            }
            console.log(data);
            res.send(data)
        })

    } catch (error) {
        next(error)
    }
});


stocksRouter.post(`/getstockarrivalreceiptList`, async (req, res, next) => {
    try {
        let rvdate = req.body.rvdate;
        console.log(rvdate);

        misQueryMod(`SELECT * FROM magod_Mtrl.mtrl_receipt_list m WHERE m.Rv_Date='${rvdate}'`, async (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            }
            console.log(data);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});


stocksRouter.post(`/getsalesdispatchsummary`, async (req, res, next) => {
    try {
        let rvdate = req.body.rvdate;
        console.log(rvdate);

        misQueryMod(`SELECT d.DC_Inv_No, d.Inv_No, d.DC_No, d.Inv_Date, d.Cust_Name, d.DC_InvType, 
        d1.Material,sum( d1.DC_Srl_Wt) as DC_Srl_Wt 
        FROM magodmis.draft_dc_inv_register d,magodmis.draft_dc_inv_details d1
        WHERE d.DC_InvType like '%sales%' AND not (d.Inv_No is  null or d.Inv_No like 'Ca%' or d.Inv_No like 'no%') 
        AND d.Inv_Date='${rvdate}' AND d.DC_Inv_No=d1.DC_Inv_No
        Group By d.DC_Inv_No,d1.Material`, async (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            }
            console.log(data);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});


stocksRouter.post(`/getsalesdispatchinvoices`, async (req, res, next) => {
    try {
        let rvdate = req.body.rvdate;
        console.log(rvdate);

        misQueryMod(`SELECT d.DC_Inv_No, d.Inv_No, d.DC_No, d.Inv_Date, d.Cust_Name, d.DC_InvType, 
        d1.Material,d1.Qty, d1.Unit_Wt, d1.DC_Srl_Wt, d1.Draft_dc_inv_DetailsID,d1.DC_Inv_Srl
        FROM magodmis.draft_dc_inv_register d,magodmis.draft_dc_inv_details d1 
        WHERE d.DC_InvType like '%sales%' AND not (d.Inv_No is  null or d.Inv_No like 'Ca%' or d.Inv_No   like 'no%')
        AND d.Inv_Date = '${rvdate}' AND d.DC_Inv_No=d1.DC_Inv_No` , async (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            }
            console.log(data);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

stocksRouter.post(`/getsalesdispatchstocklist`, async (req, res, next) => {
    try {
        let rvdate = req.body.rvdate;
        console.log(rvdate);

        mtrlQueryMod(`SELECT m.* FROM magod_mtrl.mtrl_sales m WHERE m.InvDate ='${rvdate}'` , async (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            }
            console.log(data);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

module.exports = stocksRouter;





