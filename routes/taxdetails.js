const taxdbRouter = require("express").Router();
var createError = require('http-errors');

const { misQuery, misQueryMod } = require('../helpers/dbconn');

taxdbRouter.post('/alltaxdetails', async (req, res, next) => {
    console.log(req.body)
    try {
        console.log(req.body.formqtntype)
        switch (req.body.formqtntype) {
            case "JobWork":
                console.log("JobWork")
                misQueryMod("SELECT * FROM magodmis.taxdb where JobWork = 0 and current_date() >= EffectiveFrom and current_date() <= EffectiveTO order by TaxName asc", (err,data) => {
                    if(err) console.log(err)
                    res.send(data);
                    console.log(data);
                })
                break;
            case "Sales":
                misQueryMod("SELECT * FROM magodmis.taxdb where Sales = 0 and current_date() >= EffectiveFrom and current_date() <= EffectiveTO order by TaxName asc", (err,data) => {
                    if(err) console.log(err)
                    res.send(data);
                })
                break;
            case "Services":
                misQueryMod("SELECT * FROM magodmis.taxdb where Service = -1 and current_date() >= EffectiveFrom and current_date() <= EffectiveTO order by TaxName asc", (err,data) => {
                    if(err) console.log(err)
                    res.send(data);
                })
                break;
            default:
                res.send({data:'Failed'})
                break;
        }


    } catch (error) {
        next(error)
    }
});



module.exports = taxdbRouter;