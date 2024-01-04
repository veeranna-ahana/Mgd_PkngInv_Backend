const mtrlgradesRouter = require("express").Router();
var createError = require('http-errors');

const { misQuery, misQueryMod } = require('../helpers/dbconn');
const { logger } = require("../helpers/logger");

mtrlgradesRouter.post('/allmtrlgrades', async (req, res, next) => {
    try {
        misQuery("Select * from magodmis.mtrlgrades order by MtrlGradeID asc", (data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

mtrlgradesRouter.post('/savenewmtrlgrades', async (req, res, next) => {
    try {
        console.log("Saving new mtrlgrades");
        console.log(req.body);
      //  materialtype,newGrade,newSpWeight,newExciseClass,newMtrlCode

        const mtrl = req.body.materialtype;
        const grde = req.body.newGrade;
        const spwt = req.body.newSpWeight;
        const excs = req.body.newExciseClass;
        const mtrlcd = req.body.newMtrlCode;
        misQueryMod(`INSERT INTO magodmis.mtrlgrades(Material,Grade,MtrlGradeID,Specific_Wt,Excise_Cl_No,VAT_Cl_No,DIN_SPECS)
        VALUES('${mtrl}','${grde}','${mtrlcd}','${spwt}','${excs}','','')`, (err,data) => {
            if (err) {
                res.send(err)
            } else {
            res.send(data)
            }
        })
    } catch (error) {
        next(error)
    }
});
mtrlgradesRouter.post('/getmaterialspwt', async (req, res, next) => {
    try {
        const mtrl = req.body.material;
        const grde = req.body.grade;
        misQuery(`Select Specific_Wt from magodmis.mtrlgrades where Material= '${mtrl}' and Grade='${grde}'`, (data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});
mtrlgradesRouter.get('/allmtrltypelists', async (req, res, next) => {
    try {
        misQuery("SELECT * FROM magodmis.mtrl_typeslist m  ORDER BY m.Material", (data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

mtrlgradesRouter.post('/allmtrlgrdtypes', async (req, res, next) => {
    try {
        let mtrltype = req.body.materialtype;
        misQuery(`SELECT m.MtrlGradeID,m.Grade,m.Specific_Wt,m.Excise_Cl_No FROM magodmis.MtrlGrades m 
        WHERE m.material='${mtrltype}' Order By m.MtrlGradeId;`, (data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

mtrlgradesRouter.get('/allmtrlshapes', async (req, res, next) => {
    try {
        misQuery(`SELECT * FROM magodmis.Shapes`, (data) => {
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

 mtrlgradesRouter.post('/allmtrlshapegrades', async (req, res, next) => {
    try {
        let shape = req.body.shape;
        misQueryMod(`SELECT m.Mtrl_Code, m.Shape, m.StaticPara1, m.StaticPara2, m.StaticPara3, m.StaticPara4,
        m.Thickness, m1.Material,m1.Grade, m1.MtrlGradeID, m1.Specific_Wt , m1.Excise_Cl_No, 
        m.Sales, m.JobWork FROM magodmis.mtrl_data m, magodmis.mtrlgrades m1 
        WHERE m1.MtrlGradeID=m.MtrlGradeID and m.Shape='${shape}' Order By Mtrl_Code`, (err,data) => {
            if(err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});
mtrlgradesRouter.post('/mtrlgrad', async (req, res, next) => {
    console.log('Mtrl Grad');
    try {
        const id = req.body.grdid;
        misQueryMod(`Select * from magodmis.mtrlgrades WHERE MtrlGradeID = '${id}'`, (err,data) => {
            if(err) logger.error(err);
            res.send(data);
        })
    } catch (error) {
        next(error)
    }
});


module.exports = mtrlgradesRouter