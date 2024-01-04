const quoteRouter = require("express").Router();
const req = require("express/lib/request");
var createError = require('http-errors')

const { setupQuery, qtnQuery, qtnQueryMod, qtnQueryModv2, misQueryMod } = require('../helpers/dbconn');
const { createFolder, writetofile } = require('../helpers/folderhelper');
const { logger } = require("../helpers/logger");

quoteRouter.post(`/quotation`, async (req, res, next) => {
    let mon = ["January", "Febraury", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"]
    try {
        // const qtndate = new Date().toString().replaceAll("T", " ").split(".")[0];
        let zzz = new Date();
        const qtndate = zzz.getFullYear() + "-" + (zzz.getMonth() + 1).toString().padStart(2, '0') + "-" + zzz.getDate() + " " + zzz.getHours() + ":" + zzz.getMinutes() + ":" + zzz.getSeconds();
        const enquiryDate = qtndate; //req.body.enquiryDate;
        const enquiryRef = req.body.enquiryRef;
        const customerName = req.body.customerName;
        const custAddress = req.body.custAddress.replaceAll("\r\n", "");
        const custcode = req.body.custcode;
        const custTele = req.body.custTele;
        const contact = req.body.contact;
        const e_mail = req.body.e_mail;
        const qtnformat = req.body.qtnformat;

        qtnQuery("SELECT *  FROM magod_setup.magod_runningno WHERE SrlType='Quotation' ORDER BY Id DESC LIMIT 1;", async (runningno) => {
            let month = new Date(Date.now()).toLocaleString('en-US', { month: 'long' })
            let qno = new Date().getFullYear().toString() + "_" + (new Date().getMonth() + 1).toString().padStart(2, '0') + '_' + (parseInt(runningno[0]["Running_No"]) + 1).toString().padStart(3, '0')
            await createFolder('Quotation', qno, month); // To Create folder at server side

            qtnQuery(`Insert into magodqtn.qtnlist (QtnNo,EnquiryDate,QtnDate,Cust_Code,CustomerName,CustAddress,CustTele,EnquiryRef,Contact,E_mail,QtnFormat) values ('${qno.replaceAll("_", "/")}', '${enquiryDate}','${qtndate}','${custcode}', '${customerName}', '${custAddress}', '${custTele}', '${enquiryRef}', '${contact}', '${e_mail}', '${qtnformat}')`, (ins) => {
                console.log(ins)
                if (ins.affectedRows == 1) {
                    qtnQuery(`UPDATE magod_setup.magod_runningno SET Running_No = Running_No + 1 WHERE SrlType='Quotation' And Id = ${runningno[0]["Id"]}`, async (updatedrunning) => {
                        console.log(`Updated running No ${JSON.stringify(updatedrunning)}`)
                    })
                }
                // To Copy the files from customer dwgs to qtndrawings qtn folder.
            })

            res.send({ quotationno: qno })
        });


        //let month = mon[new Date().getMonth()]


        // to update table runningno = runningno + 1

    } catch (error) {
        next(error)
    }
});

// ********** Suresh
quoteRouter.post('/updateprofiledetails', async (req, res, next) => {
    console.log('updateprofiledetails')
    try {
        const qtnno = req.body.quotationno;
        const tasklstdet = req.body.tasklst;
        const qno = qtnno.replaceAll("_", "/");
        //   console.log(qno);
        qtnQueryMod(`SELECT QtnID  FROM magodqtn.qtnlist where QtnNo='${qno}'`, async (err, data) => {
            if (err) logger.error(err);
            //  console.log(data);
            if (data.length > 0) {
                const qtnid = data[0].QtnID;
                for (let i = 0; i < tasklstdet.length; i++) {
                    qtnQueryMod(`UPDATE magodqtn.qtn_profiledetails SET PartNetArea = '${tasklstdet[i]["partNetArea"]}',LOC='${tasklstdet[i]["lengthOfCut"]}',
                         NoofPierces = '${tasklstdet[i]["noOfPierces"]}',OutOpen='${tasklstdet[i]["outOpen"]}',PartNetWt='${tasklstdet[i]["partNetWeight"]}',PartOutArea='${tasklstdet[i]["partOutArea"]}',
                         PartOutWt='${tasklstdet[i]["partOutWeight"]}',Complexity='${tasklstdet[i]["complexity"]}',RectWeight='${tasklstdet[i]["rectWeight"]}',PartRectArea='${tasklstdet[i]["rectArea"]}',
                         Unit_JobWork_Cost = '${tasklstdet[i]["jwcost"]}',Unit_Material_Cost = '${tasklstdet[i]["unitMaterialCost"]}'
                          WHERE QtnID = ${qtnid} And Dwg_Name = '${tasklstdet[i]["file.name"]}'`, async (err, data) => {
                        if (err) logger.error(err);

                    })
                }
                res.send({ message: "Updated Successfully" })
            }
        })
    } catch (error) {
        next(error)
    }
});

// *******  Suresh

quoteRouter.post(`/getquotations`, async (req, res, next) => {
    console.log('Profile Quotations..')
    try {
        const qtnformt = req.body.qtnformat;
        //qtnQueryMod(`SELECT q.QtnID, q.QtnNo FROM magodqtn.qtnlist q  WHERE q.QtnNo is not null and q.QtnFormat='${qtnformt}'  ORDER BY q.QtnNo Desc`, async (err, data) => {
        qtnQueryMod(`SELECT q.QtnID, q.QtnNo FROM magodqtn.qtnlist q  WHERE q.QtnNo is not null 
                    and q.QtnStatus = 'Qtn Sent' and q.QtnFormat='${qtnformt}' ORDER BY q.QtnNo Desc`, async (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});


quoteRouter.post(`/getselectedquotation`, async (req, res, next) => {
    try {
        const quoteno = req.body.quotationNo;

        if (!quoteno) throw createError.BadRequest();
        qtnQueryMod(`SELECT *  FROM magodqtn.qtnlist where QtnNo='${quoteno}'`, async (err, data) => {
            if (err) throw createError.InternalServerError(err);
            else res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

quoteRouter.post(`/getquotationitems`, async (req, res, next) => {
    try {
        //   const quoteno = req.body.quotationNo;
        console.log("req. " + req.body.qtnId);
        const qtnid = req.body.qtnId;
        console.log("Yes  Qtn ID : " + qtnid);

        if (!qtnid) throw createError.BadRequest();
        qtnQueryMod(`SELECT *  FROM magodqtn.qtn_itemslist where QtnId='${qtnid}'`, async (err, data) => {
            if (err) logger.error(err);
            else {
                console.log(data);
                res.send(data)
            }

        })
    } catch (error) {
        next(error)
    }
});

quoteRouter.post(`/getqtntaxdetails`, async (req, res, next) => {
    try {
        //   const quoteno = req.body.quotationNo;
        console.log("req tax. " + req.body.qtnId);
        const qtnid = req.body.qtnId;
        console.log("Yes  Qtn ID : " + qtnid);

        if (!qtnid) throw createError.BadRequest();
        qtnQueryMod(`SELECT *  FROM magodqtn.qtntaxes where QtnId='${qtnid}'`, async (err, data) => {
            if (err) throw createError.InternalServerError(err);
            else {
                console.log(data);
                res.send(data)
            }
        })
    } catch (error) {
        next(error)
    }
});

quoteRouter.post(`/getqtntcdetails`, async (req, res, next) => {
    try {
        //   const quoteno = req.body.quotationNo;
        console.log("req tc. " + req.body.qtnId);
        const qtnid = req.body.qtnId;
        console.log("Yes  Qtn ID : " + qtnid);

        if (!qtnid) throw createError.BadRequest();
        qtnQueryMod(`SELECT *  FROM magodqtn.qtn_termsandconditions where QtnId='${qtnid}'`, async (err, data) => {
            if (err) throw createError.InternalServerError(err);
            else {
                console.log(data);
                res.send(data)
            }
        })
    } catch (error) {
        next(error)
    }
});
quoteRouter.post(`/getqtnrejnreasons`, async (req, res, next) => {
    console.log('Reasons ')
    try {
        const qtnfor = req.body.qtnfor;
        console.log(qtnfor);

        //  if (!qtnfor) res.send(createError.BadRequest())
        qtnQueryMod(`SELECT * FROM magodqtn.qtn_rejection_reasons where For='${qtnfor}'`, async (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

//SELECT * FROM magodqtn.material_rate
quoteRouter.post(`/gettaskmaterialrates`, async (req, res, next) => {
    try {
        const filtr = req.body.filter;
        console.log(filtr);

        if (!filtr) res.send(createError.BadRequest())
        qtnQueryMod(`SELECT * FROM magodqtn.material_rate where ${filtr}`, async (err, data) => {
            if (err) logger.error(err);
            res.send(data)
        })
    } catch (error) {
        next(error)
    }
});

quoteRouter.post(`/getoperationmtrlratelist`, async (req, res, next) => {
    console.log('getopration Mtrl Rate List  ' + req.body.material)
    console.log('getopration Rate List  ' + req.body.process)
    try {
        const mtrl = req.body.material;
        const opertn = req.body.process;

        // if (!mtrl) res.send(createError.BadRequest())

        qtnQueryMod(`SELECT * FROM magodqtn.operation_mtrl_ratelist where Material='${mtrl}' And Operation= '${opertn}'`, (err, opmtrldata) => {
            if (err) logger.error(err);
            if (opmtrldata.length > 0) {
                res.send(opmtrldata);
            } else {
                opmtrldata = null;
                res.send(null);
            }
        })
    }
    catch (error) {
        next(error)
    }
});

quoteRouter.post(`/gettaskprogrammingrates`, async (req, res, next) => {
    try {
        console.log('Programming Rate List ');
        qtnQueryMod(`SELECT * FROM magodqtn.programmingratelist where current ='-1'`, (err, prgrtdata) => {
            if (err) logger.error(err);
            res.send(prgrtdata)
        })
    }
    catch (error) {
        next(error)
    }
});

quoteRouter.post(`/getmtrlhandlingrates`, async (req, res, next) => {
    try {
        const mtrl = req.body.material;
        console.log("getmtrlhandlingrates - " + mtrl)
        //   const opertn = req.body.process;

        //   if (!mtrl) res.send(createError.BadRequest())

        qtnQueryMod(`SELECT * FROM magodqtn.mtrl_handling_rates where Material='${mtrl}'`, (err, mtrlrtdata) => {
            if (err) logger.error(err);
            res.send(mtrlrtdata)
        })
    }
    catch (error) {
        next(error)
    }
});


quoteRouter.post(`/savefabassyparts`, async (req, res, next) => {
    try {
        let parentid = req.body.parentid;

        qtnQueryMod(`Insert into magodqtn.fabrication_assyparts(QtnId, ParentId,Name, IsAssy,Source)
            Values()`, (err, ins) => {

        })
    }
    catch (error) { next(error) }
});



quoteRouter.post(`/gettaskprogrammingrates`, async (req, res, next) => {
    try {
        //  const mtrl = req.body.material;
        //   const opertn = req.body.process;

        // if (!mtrl) res.send(createError.BadRequest())

        qtnQueryMod(`SELECT * FROM magodqtn.programmingratelist p where p.current`, async (err, prgmrtdata) => {
            if (err) logger.error(err);
            console.log(prgmrtdata);
            res.send(prgmrtdata)
        })
    }
    catch (error) {
        next(error)
    }
});

quoteRouter.post(`/getquotationlist`, async (req, res, next) => {
    console.log(req.body)
    try {
        const qtnstatus = req.body.qtnstatus;
        const qtnformat = req.body.qtnformat;
        console.log(qtnformat);

        //if ((!qtnformat) && (!qtnstatus)) res.send(createError.BadRequest())
        switch (qtnstatus) {

            case "Created": //"ToSend":
                //qtnQuery(`SELECT * FROM magodqtn.QtnList WHERE QtnFormat='${qtnformat}' AND QtnStatus='Created' AND  OrderStatus is null`, async (data) => {
                qtnQueryMod(`SELECT * FROM magodqtn.QtnList WHERE QtnStatus='Created'`, async (err, data) => {
                    if (err) logger.error(err);
                    res.send(data)
                });
                break;
            case "Qtn Sent":
                //qtnQuery(`SELECT * FROM magodqtn.QtnList WHERE QtnFormat='${qtnformat}' AND QtnStatus='Qtn Sent' AND  OrderStatus is null`, async (data) => {
                qtnQueryMod(`SELECT * FROM magodqtn.QtnList WHERE QtnStatus='Qtn Sent'`, async (err, data) => {
                    if (err) logger.error(err);
                    res.send(data)
                });
                break;
            case "No Order":
                //qtnQuery(`SELECT * FROM magodqtn.QtnList WHERE QtnFormat='${qtnformat}' AND Qtnstatus='No Order'`, async (data) => {
                qtnQueryMod(`SELECT * FROM magodqtn.QtnList WHERE Qtnstatus='No Order'`, async (err, data) => {
                    if (err) logger.error(err);
                    res.send(data)
                });
                break;
            case "Order Received":
                //QtnFormat='${qtnformat}' AND
                qtnQuery(`SELECT * FROM magodqtn.QtnList WHERE  QtnStatus='Order Received'`, async (err, data) => {
                    if (err) logger.error(err);
                    res.send(data)
                });
                break;
            case "Closed":
                //QtnFormat='${qtnformat}' AND
                qtnQueryMod(`SELECT * FROM magodqtn.QtnList WHERE  QtnStatus='Closed'`, async (err, data) => {
                    if (err) logger.error(err);
                    res.send(data)
                });
                break;
            case "Cancelled":
                qtnQueryMod(`SELECT * FROM magodqtn.QtnList WHERE QtnFormat='${qtnformat}' AND QtnStatus='Cancelled'`, async (err, data) => {
                    if (err) logger.error(err);
                    res.send(data)
                });
                break;
            default:
                qtnQueryMod(`SELECT * FROM magodqtn.QtnList WHERE QtnFormat='${qtnformat}'`, async (err, data) => {
                    if (err) logger.error(err);
                    res.send(data)
                });
                break;
        }
    } catch (error) {
        next(error)
    }
});

quoteRouter.post('/uploaddxf', async (req, res, next) => {
    try {
        const file = req.files.file;
        const quotationNo = req.body.quotationNo;
        const month = ["January", "Febraury", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][new Date().getMonth()]
        file.mv(`C:/Magod/Jigani/QtnDwg/${month}/${quotationNo}/${file.name}`, (err) => {
            if (err) {
                console.log(err)
                logger.error(err);
                res.send({ status: 'failed upload' })
            } else {
                res.send({ status: 'success' })
            }
        })
    } catch (error) {
        next(error)
    }
})

quoteRouter.post('/quotationstatusupdate', async (req, res, next) => {
    try {
        console.log(req.body)
        const qtnid = req.body.qtnid;
        const qtnstatus = req.body.qtnstatus;
        const qtnrejreason = req.body.qtnrejreason;
        const qtnreasondesc = req.body.qtnreasondesc;
        let msg = "";
        let qtnrec = "";

        if (!qtnid || !qtnstatus) res.send(createError.BadRequest())
        if (qtnrejreason) {
            qtnQueryMod(`Select * from magodqtn.qtnlist where QtnID = '${qtnid}'`, (err, qtnchk) => {
                if (qtnchk != null) {
                    qtnQueryMod(`Update magodqtn.qtnlist set NoOrder = '${qtnrejreason + qtnreasondesc}',QtnStatus= '${qtnstatus}' where QtnID ='${qtnid}'`, (err, qtnrec) => {
                        res.send({ status: "Quotation Updated Sucessfully.." });
                        return;
                    })
                }
                else {
                    res.send({ status: "Quotation not found.." })
                    return;
                }
            });
        }
        else {
            qtnQueryMod(`Select * from magodqtn.qtnlist where QtnID = '${qtnid}'`, (err, qtnchk) => {
                if (qtnchk != null) {
                    qtnQueryMod(`Update magodqtn.qtnlist set NoOrder = '${qtnreasondesc}',QtnStatus= '${qtnstatus}' where QtnID ='${qtnid}'`, (err, qtnrec) => {
                        res.send({ status: "Quotation Updated Sucessfully.." });
                        return;
                    })
                }
                else {
                    res.send({ status: "Quotation not found.." })
                    return;
                }
            });
        }
    } catch (error) {
        next(error)
    }
})

quoteRouter.post(`/quotationinsert`, async (req, res, next) => {

    try {
        const quotationno = req.body.quotationno;
        const qtndate = new Date().now;
        const enquiryDate = new Date().now; //req.body.enquiryDate;
        const enquiryRef = req.body.enquiryRef;
        const customerName = req.body.customerName;
        const custAddress = req.body.custAddress;
        const custcode = req.body.custcode;
        const custTele = req.body.custTele;
        const contact = req.body.contact;
        const e_mail = req.body.e_mail;
        const qtnformat = req.body.qtnformat;

        if (!quotationno || !customerName || !enquiryRef) return res.send(createError.BadRequest())
        let qtnchk = await qtnQuery("Select * from magodqtn.qtnlist where qtnno = '" + quotationno + "'");
        if (qthchk == null) {
            let qtnrec = await qtnQuery("Insert into magodqtn.qtnlist (QtnNo,EnquiryDate,QtnDate,Cust_Code,CustomerName,CustAddress,CustTele,EnquiryRef,Contact,E_mail,QtnFormat) values ('" + quotationno + "', current_date(),'" + qtndate + "','" + custcode + "','" + customerName + "','" + custAddress + "','" + custTele + "','" + enquiryRef + "','" + contact + "','" + e_mail + "','" + qtnformat + "')");
        }
        else {
            let qtnrec = await qtnQuery("Insert into magodqtn.qtnlist (QtnNo,EnquiryDate,QtnDate,Cust_Code,CustomerName,CustAddress,CustTele,EnquiryRef,Contact,E_mail) values ('" + quotationno + "', current_date(),'" + qtndate + "','" + custcode + "','" + customerName + "','" + custAddress + "','" + custTele + "','" + enquiryRef + "','" + contact + "','" + e_mail + "')");
        }

        //console.log(qtnrec);

        // let month = new Date(Date.now()).toLocaleString('en-US', {month: 'long'})
        // let qno = new Date().getFullYear().toString() + "_" + (new Date().getMonth() + 1).toString() +'_'+ (parseInt(runningno) + 1).toString().padStart(3,'0')

        // await createQtnFolder(qno, month);


        // To Create folder at server side


        res.send({ status: "success" })

        // to update table runningno = runningno + 1

    } catch (error) {
        next(error)
    }
});

quoteRouter.post('/quotationtasklistinsert', async (req, res, next) => {
    try {
        console.log(req.body)
        const qtnid = req.body.qtnid;
        const taskno = req.body.taskno;
        const operation = req.body.operation;
        const material = req.body.material;
        const mtrlgrade = req.body.mtrlgrade;
        const thickness = req.body.thickness;
        const tolerance = req.body.tolerance;
        const insplevel = req.body.insplevel;
        const mtrlcode = req.body.mtrlcode;

        let msg = "";
        let qtnrec = "";

        if (!qtnid || !taskno) return res.send(createError.BadRequest())


        for (i = 0; i <= tasks.length; i++) {
            qtnQueryMod(`Insert into magodqtn.qtntasklist (TaskNo,QtnID, Operation, material, MtrlGrade, Thickness, Tolerance, InspLevel,Mtrl_Code) 
            values ('${(i + 1)}','${qtnid}','${operation}','${material}','${mtrlgrade}','${thickness}','${tolerance},'${insplevel}','${mtrlcode}')`, (err, data) => {
                if (err) logger.error(err);
            });
        }
        qtnQueryMod(`Insert into magodqtn.taskdetails(ProfileId, QtnTaskId, QtnId, Dwg_Name, Path, Pattern, Operation, Material, MtrlGrade, 
            Thickness, Tolerance, Qty, Remarks, DwgExists, InspLevel) Select q.ProfileId,q.QtnTaskId,q.QtnId,q.Dwg_Name,q.Path,q.Pattern,q.Operation,
            q.mtrl_code,q.Material,q.MtrlGrade,q.Thickness,q.Tolerance,q.Qty,q.Remarks,q.DwgExists,q.InspLevel 
            from magodqtn.qtn_profiledetails q where q.QtnId = '${qtnid}'`, (err, data) => {
            if (err) logger.error(err);
        });

        res.send({ status: "Quotation Task Created Sucessfully.." });
        return;

    } catch (error) {
        next(error)
    }
});

quoteRouter.post('/updatequotation', async (req, res, next) => {
    try {
        let qtnno = req.body.qtnno;
        let qtndate = req.body.qtndate;
        let validupto = req.body.validupto;
        let revisionno = req.body.revisionno;
        let enquiryDate = req.body.enquiryDate;
        let enquiryRef = req.body.enquiryRef;
        let preparedby = req.body.preparedby;
        let customer = req.body.customer;
        let contact = req.body.contact;
        let address = req.body.address;
        let tele = req.body.tele;
        let email = req.body.email;
        let qtntype = req.body.qtntype;
        let qtnstatus = req.body.qtnstatus;
        let format = req.body.format;
        let qtnvalue = req.body.qtnvalue;
        let qtntax = req.body.qtntax;
        let qtntotal = req.body.qtntotal;
        let seltcdata = req.body.selectedtcdata;
        let qtxdata = req.body.qtntaxdata;

        qtnno = qtnno.replaceAll('_', '/');
        qtnQueryMod("Select * from magodqtn.qtnlist where QtnNo='" + qtnno + "'", (err, qtnidchk) => {
            console.log("qtnidchk : " + JSON.stringify(qtnidchk));
            if (qtnidchk != null) {
                let qtnid = qtnidchk[0].QtnID;
                qtnQueryMod("UPDATE magodqtn.qtnlist set QtnNo='" + qtnno + "',EnquiryDate='" + enquiryDate + "',QtnDate='" + qtndate + "',QtnType='" + qtntype + "',CustomerName='" + customer + "',CustAddress='" + address + "',CustTele='" + tele + "',EnquiryRef='" + enquiryRef + "',Contact='" + contact + "',E_mail='" + email + "',Qtn_Value='" + qtnvalue + "',QtnStatus='Created',RevNo='" + revisionno + "',ValidUpTo='" + validupto + "',QtnFormat='" + format + "',RevisonOf='" + qtnno + "',RevQtnDate=CurrentDate()'" + "' where QtnId ='" + qtnid + "'", (err, upd) => { });

                seltcdata.forEach(async element => {
                    console.log("T & C : " + qtnid);
                    console.log(element);
                    if (element.highlight === undefined) element.highlight = false;
                    qtnQueryMod("INSERT INTO magodqtn.qtn_termsandconditions(QtnID, Under, Terms, highlight) Values('" + qtnid + "','" + element.Under + "','" + element.Terms + "'," + (element.highlight.toString() == "true" ? 1 : 0) + ")", (err, ins) => { console.log(err) });

                });

                qtxdata.forEach(elem => {
                    //  console.log("Tax : "+qtnid);
                    // console.log(elem);
                    qtnQueryMod("INSERT INTO magodqtn.qtntaxes(QtnId,TaxName, TaxPercent, TaxableAmount, TaxAmount) Values('" + qtnid + "','" + elem.taxname + "','" + elem.taxpercent + "','" + elem.taxableamount + "','" + elem.taxamt + "')", (err, inc) => { });
                });


                console.log(qtnid);
                res.send({ status: "Success" });
                return;
            }
        });
    } catch (error) {
        next(error)
    }
});

quoteRouter.post('/qtnitemsdeleteandsave', async (req, res, next) => {
    try {
        console.log("Import rates");
        console.log(req.body);
        let qno = req.body.qtnno;

        let qtnno = qno.replaceAll('_', '/');

        qtnQueryMod("Select * from magodqtn.qtnlist where QtnNo='" + qtnno + "'", (err, qtnidchk) => {
            console.log("qtnidchk : " + JSON.stringify(qtnidchk));
            if (qtnidchk != null) {
                let qtnid = qtnidchk[0].QtnID;
                qtnQueryMod("DELETE FROM magodqtn.qtn_itemslist WHERE qtnId='" + qtnid + "'", (err, qtnid) => { });

                if ((req.body.format == "Laser Cutting") || (req.body.qtnformat == "Sales")) {
                    qtnQueryMod("SELECT Count(q.Unit_JobWork_Cost) JwcostCount ,Count(q.Unit_Material_cost) UMcostCount FROM magodqtn.qtn_profiledetails q WHERE (q.Unit_JobWork_Cost=0 or q.Unit_Material_cost=0) AND q.QtnId='" + qtnid + "'", (err, qtncostchk) => {
                        console.log(qtncostchk);
                        if ((qtncostchk.JwcostCount > 0) || (qtncostchk.UMcostCount > 0)) {
                            res.send({ status: "Success", cntgtr: true });
                        }
                    })

                }

                console.log(qtnid);
                //  res.send({ status: "Success" });
                return;
            }
        });

    } catch (error) {
        next(error)
    }
});

quoteRouter.post('/saveqtnitemslist', async (req, res, next) => {
    try {
        console.log("Import rates");
        console.log(req.body);
        let qno = req.body.qtnno;

        qtnno = qtnno.replaceAll('_', '/');

        qtnQueryMod("Select * from magodqtn.qtnlist where QtnNo='" + qtnno + "'", (err, qtnidchk) => {
            console.log("qtnidchk : " + JSON.stringify(qtnidchk));
            if (qtnidchk != null) {
                let qtnid = qtnidchk[0].QtnID;
                qtnQueryMod("INSERT INTO magodqtn.qtn_itemslist(QtnId, Name, Material, Operation, Quantity, BasePrice) "
                    + " SELECT q.QtnId, q.Dwg_Name,   CONCAT(q.Material,' ', q.MtrlGrade,' ', q.Thickness), q.Operation, q.QtyNested, "
                    + "ROUND(q.Unit_JobWork_Cost+q.Unit_Material_cost) as BasePrice "
                    + "FROM magodqtn.qtn_profiledetails q WHERE q.QtnId='" + qtnId + "'", (err, ins) => {
                    });

                res.send({ status: "Success" });
                return;
            }
        });

    } catch (error) {
        next(error)
    }
});

quoteRouter.delete('/deleteqtnitemdata', async (req, res, next) => {
    try {
        console.log("Item Delete btn clicked");
        let qtnno = req.body.qtnno;
        let itemToDelete = req.body.item;
        qtnno = qtnno.replaceAll('_', '/');

        qtnQueryMod("Select * from magodqtn.qtnlist where QtnNo='" + qtnno + "'", (err, qtnidchk) => {
            if (err) logger.error(err);
            console.log("qtnidchk : " + JSON.stringify(qtnidchk));
            if (qtnidchk != null) {
                let qtnid = qtnidchk[0].QtnID;
                console.log(qtnid);
                console.log(itemToDelete.name);
                qtnQueryMod("Delete from magodqtn.qtn_itemslist where QtnId = '" + qtnid + "' and Name='" + itemToDelete.name + "'", (err, chk) => {
                    if (err) logger.error(err);
                    console.log("Deleted Item - " + qtnid + " - " + itemToDelete.name)
                })
            }
        })
    } catch (error) {
        next(error)
    }
});

// Profile data save
quoteRouter.post('/saveprofilelistdata', async (req, res, next) => {
    try {
        let qtnno = req.body.quotationNo;
        let proflist = req.body.qtnProfileData;
        let dboperntype = req.body.dboperntype;

        console.log(proflist);

        let month = new Date(Date.now()).toLocaleString('en-US', { month: 'long' })
        if (!qtnno) res.send(createError.BadRequest())
        let qno = qtnno.replaceAll('_', '/');

        if (dboperntype == "Save") {
            qtnQueryMod("Select * from magodqtn.qtnlist where QtnNo='" + qno + "'", (err, qtnidchk) => {
                if (qtnidchk != null) {
                    let qtnid = qtnidchk[0].QtnID;
                    let foldername = "C:\\\\\\\\Magod\\\\Jigani\\\\QtnDwg\\\\" + month + "\\\\" + qtnno;

                    proflist.forEach((elem, index) => {
                        qtnQueryMod(`INSERT INTO magodqtn.qtn_profiledetails (QtnId, QtnSrl, Dwg_Name, Path, Pattern, Operation,PartNetArea, mtrl_code, Material, 
                            Thickness, Qty, MtrlGrade,QtnTaskId,InspLevel,Tolerance,LOC,NoofPierces,OutOpen,PartNetWt,PartOutArea,PartOutWt,
                            Complexity,RectWeight) 
                            VALUES('${qtnid}','${(index + 1)}','${elem.file.name}','${foldername}','.dxf','${elem.operation}','${elem.partNetArea}','${elem.materialcode}',
                            '${elem.material}','${elem.thickness}','${elem.quantity}','${elem.grade}','0','${elem.inspectionlevel}','${elem.tolerance}'
                            ,'${elem.lengthOfCut}','${elem.noOfPierces}','${(elem.outOpen == true ? 1 : 0)}','${elem.partNetWeight}','${elem.partOutArea}','${elem.partOutWeight}',
                            '${elem.complexity}','${elem.rectWeight}')`,
                            (err, inc) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                    });

                    res.send({ status: "Success" });
                    return;
                }
            });
        }
        else if (dboperntype == "Update") {
            qtnQueryMod("Select * from magodqtn.qtnlist where QtnNo='" + qno + "'", (err, qtnidchk) => {
                if (qtnidchk != null) {
                    let qtnid = qtnidchk[0].QtnID;
                    let foldername = "C:\\\\\\\\Magod\\\\Jigani\\\\QtnDwg\\\\" + month + "\\\\" + qtnno;

                    proflist.forEach((elem, index) => {
                        qtnQueryMod(`UPDATE magodqtn.qtn_profiledetails SET Dwg_Name='${elem.file.name}', Path='${foldername}', Pattern='.dxf', 
                            Operation='${elem.operation}', mtrl_code='${elem.materialcode}', Material='${elem.material}', Thickness='${elem.thickness}', 
                            Qty='${elem.quantity}', MtrlGrade='${elem.grade}', InspLevel='${elem.inspectionlevel}', Tolerance='${elem.tolerance}' 
                            WHERE QtnId='${qtnid}' `,
                            (err, inc) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                    });

                    res.send({ status: "Success" });
                    return;
                }
            });
        }
        else if (dboperntype == "Delete") {
            qtnQueryMod("Select * from magodqtn.qtnlist where QtnNo='" + qno + "'", (err, qtnidchk) => {
                if (err) logger.error(err);
                if (qtnidchk != null) {
                    let qtnid = qtnidchk[0].QtnID;
                    let foldername = "C:\\\\\\\\Magod\\\\Jigani\\\\QtnDwg\\\\" + month + "\\\\" + qtnno;

                    proflist.forEach((elem, index) => {
                        qtnQueryMod(`DELETE FROM magodqtn.qtn_profiledetails WHERE QtnId='${qtnid}' `,
                            (err, inc) => {
                                if (err) logger.error(err);

                            });
                    });

                    res.send({ status: "Success" });
                    return;
                }
            });
        }
    } catch (error) {
        next(error)
    }
});

// Profile Task data save
quoteRouter.post('/saveqtntasklistdets', async (req, res, next) => {
    try {
        let qtnno = req.body.quotationNo;
        let tasklist = req.body.tasklistdata;

        let tkdwgscount = req.body.tskdwgs;
        let taskloc = req.body.tskloc;
        let taskholes = req.body.tskholes;
        let tnetarea = req.body.tsknetarea;
        let tbasiccuttingcost = req.body.tskbasiccutcost;

        //   let proflist = req.body.qtnProfileData;
        console.log(tasklist);
        if (!qtnno) res.send(createError.BadRequest())
        let qno = qtnno.replaceAll('_', '/');

        qtnQueryMod("Select QtnID from magodqtn.qtnlist where QtnNo='" + qno + "'", (err, qtnidchk) => {
            if (err) logger.error(err);
            if (qtnidchk != null) {
                let qtnid = qtnidchk[0].QtnID;

                for (let i = 0; i < Object.keys(tasklist).length; i++) {

                    let taskgroup = Object.values(tasklist)[i];

                    misQueryMod(`Select MtrlGradeID from magodmis.mtrlgrades where Material='${taskgroup[0].material}' and Grade='${taskgroup[0].grade}'`, (err, mtrlgrd) => {
                        if (err) logger.error(err);

                        // taskgroup.forEach((elem, index) => {
                        //     qtnQueryMod(`INSERT INTO magodqtn.qtntasklist (TaskNo,QtnID, Operation, material, MtrlGrade,MtrlGradeID, Thickness,Tolerance,
                        //         InspLevel,Mtrl_Code,CountOfDwg_Name,TaskDwgs,TaskLOC,TaskHoles,TaskNetArea,TaskPartArea,TaskPartRectArea) 
                        //          VALUES('${taskgroup[0].taskno}', '${qtnid}','${taskgroup[0].operation}','${taskgroup[0].material}','${taskgroup[0].grade}','${mtrlgrd[0].MtrlGradeID}',
                        //          '${taskgroup[0].thickness}','${taskgroup[0].tolerance}','${taskgroup[0].inspectionlevel}','${taskgroup[0].materialcode}',
                        //          '${(taskgroup[0].CountOfDwg_Name == null) ? 0: taskgroup[0].CountOfDwg_Name }','${(taskgroup[0].CountOfDwg_Name == null) ? 0: taskgroup[0].CountOfDwg_Name }',
                        //           ${taskgroup[0].Taskloc},'${taskgroup[0].pierces}',
                        //          '${taskgroup[0].TaskNetArea}','${taskgroup[0].TaskPartArea}','${taskgroup[0].TaskPartRectArea}')`, (err, inc) => {
                        // if (err) logger.error(err);


                        misQueryMod(`Select * from magodmis.mtrlgrades where Material= '${taskgroup[0].material}' and Grade='${taskgroup[0].grade}'`, (err, data) => {
                            console.log("MtrlGrades : "+data);

                            qtnQueryMod(`INSERT INTO magodqtn.qtntasklist (TaskNo,QtnID, Operation, material, MtrlGrade,MtrlGradeID, Thickness,Tolerance,
                                    InspLevel,Mtrl_Code,SpWeight)
                                     VALUES('${taskgroup[0].taskno}', '${qtnid}','${taskgroup[0].operation}','${taskgroup[0].material}','${taskgroup[0].grade}','${mtrlgrd[0].MtrlGradeID}',
                                     '${taskgroup[0].thickness}','${taskgroup[0].tolerance}','${taskgroup[0].inspectionlevel}','${taskgroup[0].materialcode}', '${data[0].Specific_Wt}'
                                     )`, (err, inc) => {
                                if (err) logger.error(err);

                                // qtnQueryMod(`Select QtnTaskId from magodqtn.qtntasklist where QtnId='${qtnid}' AND mtrl_code='${taskgroup[0].materialcode}'`, (err, qdata) => {
                                //     if (err) logger.error(err);
                                //     console.log(qdata);
                                //     if (qdata.length > 0) {
                                qtnQueryMod(`UPDATE magodqtn.qtn_profiledetails SET QtnTaskId='${inc.insertId}' WHERE QtnId='${qtnid}' AND mtrl_code='${taskgroup[0].materialcode}'`, (err, qtn) => {
                                    if (err) logger.error(err);

                                });
                                //   }
                                //});

                            });
                        });
                    });
                }
            }
        });

    } catch (error) {
        next(error)
    }
});

// Task Details Save

// INSERT INTO magodqtn.taskdetails(ProfileId, QtnTaskId, QtnId,
//     Dwg_Name, Path, Pattern, Operation, mtrl_code, Material,MtrlGrade,Thickness,
//     Tolerance, Qty, Remarks, DwgExists,InspLevel)
//     SELECT q.ProfileId, q.QtnTaskId, q.QtnId, q.Dwg_Name, q.Path, q.Pattern,
//     q.Operation, q.mtrl_code,q.Material, q.MtrlGrade,q.Thickness,  q.Tolerance, q.Qty, 
//     q.Remarks, q.DwgExists,q.InspLevel FROM magodqtn.qtn_profiledetails q WHERE q.QtnId=@QtnId

quoteRouter.post('/savetaskdetails', async (req, res, next) => {
    try {
        let qtnno = req.body.quotationNo;
        qtnno = qtnno.replaceAll('_', '/');
        qtnQueryMod("Select * from magodqtn.qtnlist where QtnNo='" + qtnno + "'", (err, qtnidchk) => {
            if (err) logger.error(err);
            //      console.log("qtnidchk : " + JSON.stringify(qtnidchk));
            if (qtnidchk != null) {
                let qtnid = qtnidchk[0].QtnID;
                qtnQueryMod(`INSERT INTO magodqtn.taskdetails(ProfileId, QtnTaskId, QtnId, Dwg_Name, Path, Pattern, Operation, mtrl_code, 
                    Material,MtrlGrade,Thickness, Tolerance, Qty, Remarks, DwgExists,InspLevel) 
                    SELECT q.ProfileId, q.QtnTaskId, q.QtnId, q.Dwg_Name, q.Path, q.Pattern, q.Operation, q.mtrl_code,q.Material, 
                    q.MtrlGrade,q.Thickness,  q.Tolerance, q.Qty, q.Remarks, q.DwgExists,q.InspLevel FROM magodqtn.qtn_profiledetails q 
                    WHERE q.QtnId='${qtnid}'`, (err, inc) => {
                    if (err) logger.error(err);
                    //            console.log("Task Details Inserted");
                });

            }
        });
    } catch (error) {
        next(error)
    }
});

quoteRouter.post('/quotationitemslist', async (req, res, next) => {
    try {
        console.log("API Save Items");
        console.log(req.body);
        let qtnno = req.body.qtnno;
        // const qtnid = req.body.qtnid;
        const name = req.body.itemname;
        const operation = req.body.operation;
        const material = req.body.material;
        const quantity = req.body.quantity;
        const baseprice = req.body.basicPrice;
        const discountamount = (req.body.discountAmount > 0 ? req.body.discountAmount : 0);

        let msg = "";
        let qtnrec = "";

        if (!name || !operation) res.send(createError.BadRequest())
        {
            //         console.log("qtnno :" + qtnno)
            qtnno = qtnno.replaceAll('_', '/');
            qtnQueryMod("Select * from magodqtn.qtnlist where QtnNo='" + qtnno + "'", (err, qtnidchk) => {
                //               console.log("qtnidchk : " + JSON.stringify(qtnidchk));
                if (qtnidchk != null) {
                    let qtnid = qtnidchk[0].QtnID;
                    qtnQueryMod("INSERT INTO magodqtn.qtn_itemslist(QtnId, Name, Material, Operation, Quantity, BasePrice, DiscountAmount) values ('" + qtnid + "','" + name + "','" + material + "','" + operation + "','" + quantity + "','" + baseprice + "','" + discountamount + "')", (err, data) => {
                        if (err) logger.error(err);
                        console.log(qtnid);
                        res.send({ status: "Success" });
                        //                    return;
                    });
                }
            });

        }
    } catch (error) {
        next(error)
    }
});

quoteRouter.post('/chkQtnItems', async (req, res, next) => {
    try {
        let qtnno = req.body.qtnno;
        let msg = "";
        let qtnrec = "";

        let qnno = qtnno.replaceAll('_', '/');
        qtnQueryMod("Select * from magodqtn.qtnlist where QtnNo='" + qnno + "'", (err, qtnidchk) => {
            if (err) logger.error(err);
            if (qtnidchk != null) {
                let qtnid = qtnidchk[0].QtnID;
                qtnQueryMod(`Select * from magodqtn.qtn_itemslist where QtnId ='${qtnid}'`, (err, data) => {
                    if (err) logger.error(err);
                    console.log(qtnid);
                    res.send(data);
                });
            }
        });

    } catch (error) {
        next(error)
    }
});


module.exports = quoteRouter;