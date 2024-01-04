const customerRouter = require("express").Router();
var createError = require("http-errors");
const { createFolder, copyallfiles } = require("../helpers/folderhelper");
const { misQuery, setupQuery, misQueryMod } = require("../helpers/dbconn");
const req = require("express/lib/request");
const { sendDueList } = require("../helpers/sendmail");
const { logger } = require("../helpers/logger");

customerRouter.post("/allcustomers", async (req, res, next) => {
  try {
    misQueryMod(
      "Select * from magodmis.cust_data order by Cust_name asc",
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }

});

customerRouter.post("/allcustcodename", async (req, res, next) => {
  try {
    misQueryMod(
      "Select Cust_Code,Cust_name from magodmis.cust_data order by Cust_name asc",
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

customerRouter.post("/getcustomerdetails", async (req, res, next) => {
  try {
    let custid = req.body.custcode;
    misQueryMod(
      `Select * from magodmis.cust_data where Cust_Code='${custid}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

customerRouter.post("/customer", async (req, res, next) => {
  try {
    //  const custcode = req.body.Cust_Code;
    const customerName = req.body.customerName;
    const branchName = req.body.branchName;
    var isBranch = 0;
    if (branchName != null) {
      isBranch = 1;
    } else {
      isBranch = 0;
    }
    let msg = "";
    // misQueryMod(`Select * from magodmis.cust_data where lower(Cust_name)='${lower(customerName)}' and lower(Branch)='${lower(branchName)}'`, (err, result) => {
    misQueryMod(
      `Select * from magodmis.cust_data where lower(Cust_name)=Lower('${customerName}')`,
      (err, result) => {
        if (err) logger.error(err);
        console.log(result);
        if (result.length > 0) {
          console.log("Customer Already Exists.." + customerName);
          misQueryMod(
            "Update magodmis.cust_data set IsBranch='" +
            isBranch +
            "',Branch='" +
            branchName +
            "' where Cust_name='" +
            customerName +
            "' And Cust_Code ='" +
            result["Cust_Code"] +
            "'",
            (err, result1) => {
              if (err) logger.error(err);
              res.send(result1);
            }
          );
        } else {
          console.log("New Customer..");
          setupQuery(
            "SELECT *  FROM magod_setup.magod_runningno WHERE SrlType='CustCode' ORDER BY Id DESC LIMIT 1;",
            async (runningno) => {
              let month = new Date(Date.now()).toLocaleString("en-US", {
                month: "long",
              });
              let qno = (parseInt(runningno[0]["Running_No"]) + 1)
                .toString()
                .padStart(4, "0");
              console.log(qno);
              createFolder("Customer", qno, month, (err, fres) => {
                if (err) logger.error(err);
              });

              misQueryMod(
                `Insert into magodmis.cust_data (Cust_Code,IsBranch,Cust_name,Branch) values ('${qno}', '${isBranch}','${customerName}','${branchName}')`,
                (err, ins) => {
                  if (err) logger.error(err);
                  console.log(ins);
                  if (ins && ins.affectedRows > 0) {
                    setupQuery(
                      `UPDATE magod_setup.magod_runningno SET Running_No = Running_No + 1 WHERE SrlType='CustCode' And Id = ${runningno[0]["Id"]}`,
                      async (updatedrunning) => {
                        console.log(
                          `Updated running No ${JSON.stringify(updatedrunning)}`
                        );
                        res.send({ status: "success", custcode: qno });
                      }
                    );
                  }
                }
              );
            }
          );
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

customerRouter.post(`/customerupdate`, async (req, res, next) => {
  console.log("customerupdate - Yes");
  try {
    let msg = "";
    const custcode = req.body.custcode;
    console.log("Check on Cust code : " + custcode);
    const custaddress = req.body.custAddress;
    const branchname = req.body.branchName;
    const custcity = req.body.city;
    const pincode = req.body.pincode;
    const state = req.body.state;
    const stateid = req.body.stateid;
    const country = req.body.country;
    const email = req.body.compemail;
    const crterm = req.body.crterms;
    const maxcredit = req.body.maxcredit == null ? 0.0 : req.body.maxcredit;
    const creditdays = req.body.creditdays == null ? 0 : req.body.creditdays;
    const avepaydays =
      req.body.avepaydays == null || req.body.avepaydays == ""
        ? 0
        : req.body.avepaydays;
    //  const firstbillingdt = req.body.firstbillingdt ? req.body.firstbillingdt : '0000-00-00';
    //  const lastbillingdt = req.body.lastbillingdt ? req.body.lastbillingdt : '0000-00-00';
    const gstno = req.body.gstno;
    const panno = req.body.panno;
    const govtorg = req.body.govtorg;
    const isexport = req.body.isexport;
    const foldername = req.body.custfoldername;
    console.log(req.body.custcurent);
    const ccurrent = req.body.custcurent ? 1 : 0;
    console.log(ccurrent);
    const delivery = req.body.delivery;

    const contactdetails = req.body.custContactData;

    console.log(
      "cont details from req : " + JSON.stringify(req.body.custContactData)
    );
    //  const contacttelenos = req.body.custContTeleData;

    //   console.log("customerupdate T - Yes1 " + req.body.contacttelenos.length)

    var gstexempt = 0;
    if (govtorg == 1) {
      gstexempt = 1;
    }
    console.log("contact details : " + contactdetails);
    //   if (!custcode) res.send(createError.BadRequest())
    misQuery(
      "Select * from magodmis.cust_data where Cust_Code = '" + custcode + "'",
      async (response) => {
        if (response != null) {
          misQuery(
            `Update magodmis.cust_data set Branch = '${branchname}', Address='${custaddress}',City = '${custcity}', StateId= '${stateid}', State = '${state}', Country = '${country}',Pin_Code='${pincode}', EMail='${email}',IsGovtOrg=${govtorg},IsForiegn=${isexport}, GST_Exempt='${gstexempt}',CreditTerms='${crterm}',CreditTime='${creditdays}',CreditLimit=${maxcredit}, CreditTime=${creditdays}, AveragePymtPeriod=${avepaydays}, GSTNo='${gstno}',PAN_No='${panno}',DWG='${foldername}',CURRENT=${ccurrent},Delivery='${delivery}',CustStatus='OK' where Cust_Code='${custcode}'`,
            async (response2) => {
              let month = "";
              if (foldername != custcode) {
                createFolder("Customer", foldername, month, (err, fres) => {
                  if (err) logger.error(err);
                  copyallfiles("Customer", custcode, foldername);
                });
              }
              // Contact Loop
              // console.log("Contact Loop : " + contactdetails);  // JSON.stringify(contactdetails))
              for (let i = 0; i < contactdetails.length; i++) {
                console.log(
                  "inside For loop " + JSON.stringify(contactdetails)
                );
                // if (contactdetails[i]["conName"] === "") {
                //     break;
                // }
                await misQueryMod(
                  `Delete from magodmis.cust_contacts where Cust_code ='${custcode}'`,
                  (err, deldata) => {
                    if (err) logger.error(err);
                  }
                );
                await misQueryMod(
                  `Select * from magodmis.cust_contacts where Name = '${contactdetails[i].conName}' and Cust_code ='${custcode}'`,
                  (err, contdata) => {
                    if (err) logger.error(err);
                    console.log(" contact exists " + contdata.length);
                    if (contdata.length > 0) {
                      misQueryMod(
                        `Update magodmis.cust_contacts set Designation = '${contactdetails[i].conDesignation}',E_mail ='${contactdetails[i].conE_mail}',
                                                Dept='${contactdetails[i].conDept}', Tele_Office='${contactdetails[i].conTele_Office}', Tele_Mobile='${contactdetails[i].conTele_Mobile}' 
                                                where Cust_code='${custcode}' and Name = '${contactdetails[i]["conName"]}'`,
                        async (err, updata) => {
                          if (err) logger.error(err);
                          console.log("contacts updated ");
                        }
                      );
                    } else {
                      console.log("inserting contacts ");
                      console.log("Cust Code : " + req.body.custcode);
                      misQueryMod(
                        "insert into magodmis.cust_contacts (Cust_code,Name,Designation,E_mail,Dept,Tele_Office,Tele_Mobile)" +
                        " values('" +
                        custcode +
                        "','" +
                        contactdetails[i].conName +
                        "','" +
                        contactdetails[i].conDesignation +
                        "','" +
                        contactdetails[i].conE_mail +
                        "','" +
                        contactdetails[i].conDept +
                        "','" +
                        contactdetails[i].conTele_Office +
                        "','" +
                        contactdetails[i].conTele_Mobile +
                        "')",
                        async (err, contins) => {
                          if (err) logger.error(err);
                          //         console.log("Contact Inserted" + contins)
                        }
                      );
                    }
                  }
                );
                //         console.log(contactdetails[i].conName + " " + contactdetails[i].conDesignation + " " + contactdetails[i].conE_mail + " " + contactdetails[i].conDept)
              }
              //                         console.log("After contact loop - Starting Telephone loop ")
              //                         // Telephone Loop
              //                         console.log(custcode);
              //                         misQueryMod(`Select ContactID from magodmis.cust_contacts where Cust_Code='${custcode}'`, (err, dataresp) => {
              //                             if (err) console.log(err)
              //                             console.log("Tele nos data " + JSON.stringify(contacttelenos));
              //                             if (dataresp.length > 0) {
              //                                 for (let i = 0; i < dataresp.length; i++) {
              //                                     if (contacttelenos.length == 0) {
              //                                         misQuery(`Delete from magodmis.contact_telenos where ContactID = '${dataresp[i].ContactID}'`, (deltdata) => { })
              //                                         break;
              //                                     }
              //                                 }
              // console.log("Entering Tele Loop ")
              //                                 for (let j = 0; j < contacttelenos.length; j++) {
              //                                     // if (contacttelenos[i]["conteleno"] == "") {
              //                                     //     break;
              //                                     // }
              //                                     console.log("Inside loop inserting ")
              //                                     //    await misQuery(`Delete from magodmis.contact_telenos where TeleNo = '${contacttelenos[i].conteleno}'`,(deldata) => {})

              //                                     misQueryMod(`Select * from magodmis.contact_telenos where TeleNo = '${contacttelenos[j].conteleno}' and ContactID = '${dataresp[j].ContactID}'`, async (terr, teledata) => {
              //                                         console.log(" tele details found for customers ")
              //                                         if (teledata.length > 0) {
              //                                             misQuery(`Update magodmis.contact_telenos set  TeleNo = '${contacttelenos[j].conteleno}', Type='${contacttelenos[j].conteletype}' where ContactID = '${dataresp[j].ContactID}'`, (tedata) => { });
              //                                             console.log("tele details updated")
              //                                         } else {
              //                                             misQueryMod("insert into magodmis.contact_telenos (ContactID,TeleNo,Type)" +
              //                                                 " values('" + dataresp[0].ContactID + "','" + contacttelenos[j].conteleno + "','" + contacttelenos[j].conteletype + "')", async (ierr, ins) => {
              //                                                     msg = 'success';
              //                                                     console.log("tele details inserted ")
              //                                                 });
              //                                         }
              //                                     })
              //                                     console.log("Contact Tele : " + contacttelenos[j].conteleno)
              //                                 }
              //                             }
              //                         });
            }
          );
        }
      }
    );
    res.send({ status: msg });
  } catch (error) {
    next(error);
  }
});

customerRouter.post("/getcustomercontactdets", async (req, res, next) => {
  console.log("get contact dets");
  try {
    let custid = req.body.custcode;
    console.log("customer code : " + custid);
    misQueryMod(
      `Select ContactID, Name as conName, Designation as conDesignation, Dept as conDept, E_mail as conE_mail,Tele_Office as conTele_Office,
                    Tele_Mobile as conTele_Mobile from magodmis.cust_contacts where Cust_Code='${custid}'`,
      (err, data) => {
        if (err) logger.error(err);
        console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// customerRouter.post('/getcustomercontactteledets', async (req, res, next) => {
//     console.log("teledets - 1")
//     try {
//         //  let contid = req.body.contid;
//         let custid = req.body.custcode;
//         let tdata = "";
//         misQueryMod(`Select ContactID from magodmis.cust_contacts where Cust_Code='${custid}'`, (err, contdata) => {
//             console.log(contdata);
//             if (contdata.length > 0) {
//                 console.log("contdata > 0")
//                 let contdatas = "('";
//                 for (let i = 0; i < contdata.length; i++) {
//                     contdatas = contdatas + contdata[i]["ContactID"] + "','";

//                 }

//                 contdatas = contdatas.substr(0, contdatas.length - 2);
//                 console.log(contdatas)
//                 //  let contid = contdata[i].ContactID;
//                 // misQueryMod(`Select ContactID,TeleNo as conteleno, Type as conteletype from magodmis.contact_telenos where ContactID='${contdata[i].ContactID}'`, (err, teledata) => {
//                 misQueryMod(`Select ContactID,TeleNo as 'conteleno', Type as 'conteletype'  from magodmis.contact_telenos where ContactID in ${contdatas + ')'}`, (err, teledata) => {
//                     if (err) console.log(err);
//                     console.log("Tele Data - after contact query " + teledata);
//                     // tdata[i]= tdata[i] + teledata;
//                     res.send(teledata);
//                 })
//             }

//         })
//     } catch (error) {
//         next(error)
//     }
// });

// Existing Assembly Data for a Customer
customerRouter.post(`/customerassy`, async (req, res, next) => {
  // console.log(req.body);
  try {
    const custcode = req.body.custcode;
    if (!custcode) res.send(createError.BadRequest());
    misQueryMod(
      `SELECT * FROM magodmis.cust_assy_data where Cust_Code = '${custcode}' order by MagodCode asc`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// Inserting Customer Assembly data
customerRouter.post("/customerinsassembly", async (req, res, next) => {
  console.log("Customer Assembly Insertion");
  try {
    const custcode = req.body.custcode;
    const assycustpartid = req.body.partid;
    const assydescription = req.body.partdescription;
    const mtrlcost =
      req.body.mtrlcost == null || req.body.mtrlcost == ""
        ? 0
        : req.body.mtrlcost;
    const jwcost =
      req.body.jwcost == null || req.body.jwcost == "" ? 0 : req.body.jwcost;
    const assystatus = "Edit"; // req.body.assystatus;
    console.log(req.body);

    setupQuery(
      "SELECT *  FROM magod_setup.magod_runningno WHERE SrlType='Cust_AssyList' ORDER BY Id DESC LIMIT 1;",
      async (runningno) => {
        let magodassmid =
          "Assy" +
          (parseInt(runningno[0]["Running_No"]) + 1)
            .toString()
            .padStart(6, "0");
        console.log(magodassmid);

        await misQueryMod(
          `INSERT INTO magodmis.cust_assy_data ( Cust_code,MagodCode, AssyCust_PartId, AssyDescription,MtrlCost,JobWorkCost,Status) VALUES('${custcode}','${magodassmid}', '${assycustpartid}', '${assydescription}',${mtrlcost},${jwcost},'${assystatus}')`,
          (err, ins) => {
            if (err) logger.error(err);
            console.log(ins);
            if (ins.affectedRows == 1) {
              setupQuery(
                `UPDATE magod_setup.magod_runningno SET Running_No = Running_No + 1 WHERE SrlType='Cust_AssyList' And Id = ${runningno[0]["Id"]}`,
                async (updatedrunning) => {
                  console.log(
                    `Updated running No ${JSON.stringify(updatedrunning)}`
                  );
                }
              );
            }
          }
        );
        res.send({ magodassmid: magodassmid });
      }
    );
  } catch (error) {
    next(error);
  }
});
// Checking Duplicate Customer Assembly data
customerRouter.post("/chkassydupl", async (req, res, next) => {
  console.log("Checking Duplicate Customer Assembly data");
  try {
    const custcode = req.body.custcode;
    const assycustpartid = req.body.partid;

    misQueryMod(
      `SELECT * FROM magodmis.cust_assy_data where Cust_code = '${custcode}' and AssyCust_PartId = '${assycustpartid}'`,
      (err, data) => {
        if (err) logger.error(err);
        console.log(data);
        if (data.length > 0) {
          res.send({ status: "Duplicate" });
        } else {
          res.send({ status: "Not Duplicate" });
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

// Inserting Customer BOM PArts data
customerRouter.post("/custbomparts", async (req, res, next) => {
  console.log("Customer BOM Parts Insertion");
  try {
    const custcode = req.body.custcode;
    const partid = req.body.partid;
    const partdescription = req.body.partdescription;

    console.log(req.body);

    if (!custcode || !partid || !partdescription)
      res.send(createError.BadRequest());
    setupQuery(
      `SELECT * FROM magodmis.cust_bomlist where Cust_code = '${custcode}' and PartId = '${partid}'`,
      async (data) => {
        if (data.length == 0) {
          setupQuery(
            "SELECT *  FROM magod_setup.magod_runningno WHERE SrlType='BOMList' ORDER BY Id DESC LIMIT 1;",
            async (runningno) => {
              let magodpartid =
                "BOM " +
                (parseInt(runningno[0]["Running_No"]) + 1)
                  .toString()
                  .padStart(10, "0");
              console.log(magodpartid);

              misQueryMod(
                `INSERT INTO magodmis.cust_bomlist ( MagodPartId, Cust_code,PartId, PartDescription) VALUES('${magodpartid}', '${custcode}','${partid}', '${partdescription}')`,
                (err, ins) => {
                  if (err) logger.error(err);
                  console.log(ins);
                  if (ins.affectedRows == 1) {
                    setupQuery(
                      `UPDATE magod_setup.magod_runningno SET Running_No = Running_No + 1 WHERE SrlType='BOMList' And Id = ${runningno[0]["Id"]}`,
                      async (updatedrunning) => {
                        console.log(
                          `Updated running No ${JSON.stringify(updatedrunning)}`
                        );
                      }
                    );

                    misQueryMod(
                      `Select * from magodmis.cust_bomlist where cust_code='${custcode}'`,
                      (err, data) => {
                        if (err) logger.error(err);
                        res.send({ data, status: "Success" });
                      }
                    );
                  }
                }
              );
              //  res.send({ magodpartid: magodpartid })
            }
          );
        } else {
          res.send({ data, status: "Duplicate" });
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

customerRouter.post("/getcustomercontactdets", async (req, res, next) => {
  console.log("Existing Customer Contact");
  try {
    const { custcode } = req.body.custcode;
    misQueryMod(
      `SELECT * FROM magodmis.contact_data where Cust_Code = '${custcode}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// customerRouter.post("/getcustomercontactteledets", async (req,res,next) => {
//     console.log("Existing Customer Contact")
//     try {
//         const {contid} = req.body.contid;
//         misQuery(`SELECT * FROM magodmis.contact_tele_data where Contact_Id = '${contid}'`, (data) => {
//             res.send(data)
//         })
//     } catch (error) {
//         next(error)
//     }
// });

// sending data to Customer Part Receipt
customerRouter.post(`/getcustomerbomparts`, async (req, res, next) => {
  console.log("getcustomerbomparts");
  try {
    const ccode = req.body.custcode;
    console.log(ccode);
    misQueryMod(
      `SELECT * FROM magodmis.cust_bomlist where Cust_code ='${ccode}'`,
      (err, data) => {
        if (err) logger.error(err);
        console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// Bom Assembly Parts
customerRouter.post("/bomassemblyparts", async (req, res) => {
  console.log("Bom Assembly Parts");
  try {
    const ccode = req.body.custcode;
    const dataarray = req.body.dataarray;
    console.log(" Customer Code : " + ccode);
    let retdata = [];
    console.log("bom assm parts : " + dataarray.length);
    for (let i = 0; i < dataarray.length; i++) {
      const { assyPartId, partid, partdesc, qty } = dataarray[i];
      //   console.log(dataarray[i]);
      if (
        dataarray[i].assyPartId != "" &&
        dataarray[i].partid != "" &&
        dataarray[i].partid != null
      ) {
        console.log(
          "Saving Assm Parts : " + dataarray[i].partid + "  cust : " + ccode
        );
        misQueryMod(
          `Insert into magodmis.cust_assy_bom_list (Cust_AssyId, Cust_BOM_ListId, Quantity)
            Values(
                (Select assytbl.Id as assyid from magodmis.cust_assy_data assytbl where AssyCust_PartId = '${dataarray[i].assyPartId}' and Cust_code='${ccode}'),
                (SELECT bomlist.Id FROM magodmis.cust_bomlist as bomlist where PartId = '${dataarray[i].partid}' and Cust_code='${ccode}'), ${dataarray[i].qty})`,
          (err, data) => {
            if (err) logger.error(err);
            retdata.push(data);
          }
        );
      }
    }
    res.send({ status: "success", data: retdata });
  } catch (error) {
    return res.send({ status: "error", error: error });
    //next(error)
  }
});

// Get Customer BOM Parts
customerRouter.post("/getcustpartdetails", async (req, res, next) => {
  //  console.log("Customer Part details" + req.body.custcode)
  try {
    const custcode = req.body.custcode;
    misQueryMod(
      `SELECT * FROM magodmis.cust_bomlist where Cust_code = '${custcode}'`,
      (err, data) => {
        if (err) logger.error(err);
        //        console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// Get Customer BOM Assembly Parts
customerRouter.post("/custbomassemblyparts", async (req, res, next) => {
  //   console.log("Customer BOM Assembly Parts" + req.body.custcode)

  try {
    const custcode = req.body.custcode;
    const assyId = req.body.custassyid;
    console.log(req.body.custassyid);

    misQueryMod(
      `SELECT asm.AssyCust_PartId as assyPartId, bom.PartId as partid,bom.PartDescription as partdesc,asmbom.Quantity as qty from magodmis.cust_assy_data asm
        left outer join magodmis.cust_assy_bom_list asmbom on asmbom.Cust_AssyId = asm.Id
        left outer join magodmis.cust_bomlist bom on bom.Id = asmbom.cust_BOM_ListId
        where asm.Cust_Code='${custcode}' and asm.AssyCust_PartId ='${assyId}'`,
      (err, data) => {
        if (err) logger.error(err);
        //        console.log(data)
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// Get Existing Customer

customerRouter.post(`/getcustomer`, async (req, res, next) => {
  //   console.log("Cust Code received");
  try {
    const custcode = req.body.custcode;
    //    console.log(custcode);

    if (!custcode) res.send(createError.BadRequest());
    misQueryMod(
      `SELECT * FROM magodmis.cust_data where Cust_Code = '${custcode}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// geting customer drawing data
//SELECT * FROM magodmis.dwg_data d WHERE d.`Cust_Code`=@Cust_Code;
customerRouter.post(`/customersdrawings`, async (req, res, next) => {
  //    console.log(req.body);
  try {
    const custcode = req.body.custcode;

    if (!custcode) res.send(createError.BadRequest());

    // misQuery("SELECT Dwg_Code,Cust_Code,DwgName,Mtrl_Code,DxfLoc,Operation,MtrlCost,JobWorkCost,LOC,Holes,Weight FROM magodmis.dwg_data; where Cust_Code = '" + custcode + "'", (data) => {
    misQueryMod(
      `SELECT Dwg_Code,Cust_Code,DwgName,Mtrl_Code,DxfLoc,Operation,MtrlCost,JobWorkCost,LOC,Holes,FORMAT(Part_Wt,3) as Weight FROM magodmis.dwg_data where Cust_Code = '${custcode}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// geting customer Order data
customerRouter.post(`/customerorders`, async (req, res, next) => {
  console.log("customerorders");
  try {
    const custcode = req.body.custcode;
    const ordstatus = req.body.orderstatus;
    const ordtype = req.body.otype;
    const ordertype = req.body.ordertype;

    console.log(custcode);
    console.log(ordstatus);
    console.log(ordtype);
    console.log(ordertype);
    if (!custcode) res.send(createError.BadRequest());
    if (ordtype == null) {
      if (ordstatus !== "All") {
        misQueryMod(
          `SELECT o.*,c.Cust_name FROM magodmis.order_list o 
                left join magodmis.cust_data c on c.Cust_Code = o.Cust_Code
                WHERE o.Cust_Code='${custcode}' AND  Order_Status ='${ordstatus}'   ORDER BY o.Order_Date Desc`,
          (err, data) => {
            if (err) logger.error(err);
            //And Order_Type='${ordertype}'
            console.log(data);
            res.send(data);
          }
        );
      } else {
        misQueryMod(
          `SELECT o.*,c.Cust_name FROM magodmis.order_list o 
                left join magodmis.cust_data c on c.Cust_Code = o.Cust_Code  
                WHERE o.Cust_Code='${custcode}' ORDER BY o.Order_Date Desc`,
          (err, data) => {
            if (err) logger.error(err);
            console.log(data);
            res.send(data);
          }
        );
      }
    } else {
      if (ordstatus != "All") {
        misQueryMod(
          `SELECT o.*,c.Cust_name FROM magodmis.order_list o 
                left join magodmis.cust_data c on c.Cust_Code = o.Cust_Code
                WHERE o.Cust_Code='${custcode}' AND  Order_Status ='${ordstatus}' and Type='${ordtype}' And Order_Type='${ordertype}'  ORDER BY o.Order_Date Desc`,
          (err, data) => {
            if (err) logger.error(err);
            console.log(data);
            res.send(data);
          }
        );
      } else {
        misQueryMod(
          `SELECT o.*,c.Cust_name FROM magodmis.order_list o 
                left join magodmis.cust_data c on c.Cust_Code = o.Cust_Code  
                WHERE o.Cust_Code='${custcode}'  ORDER BY o.Order_Date Desc`,
          (err, data) => {
            if (err) logger.error(err);
            console.log(data);
            res.send(data);
          }
        );
      }
    }
  } catch (error) {
    next(error);
  }
});

// geting customer Order Status data
customerRouter.post(`/orderstatus`, async (req, res, next) => {
  try {
    //   if (!doctype) res.send(createError.BadRequest())
    setupQuery(
      `SELECT * FROM magod_setup.magod_statuslist s where s.Function = 'Order' order by Seniority asc`,
      (data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// geting customer Order Schedule data
customerRouter.post(`/orderschedule`, async (req, res, next) => {
  console.log(req.body);
  try {
    const orderno = req.body.orderno;

    misQueryMod(
      `SELECT o.*  FROM magodmis.orderschedule o WHERE o.Order_No ='${orderno}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// geting customer Order Schedule Tasks data
customerRouter.post(`/orderschtasks`, async (req, res, next) => {
  console.log(req.body);
  try {
    const orderno = req.body.orderno;
    const ordschid = req.body.ordschid;
    misQueryMod(
      `SELECT n.* FROM magodmis.nc_task_list n
        inner join magodmis.orderschedule o on o.ScheduleID = n.ScheduleID
        WHERE  o.Order_No ='${orderno}' and n.ScheduleID = '${ordschid}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// geting customer Order Details data
customerRouter.post(`/orderdetails`, async (req, res, next) => {
  console.log(req.body);
  try {
    const orderno = req.body.orderno;
    misQueryMod(
      `SELECT o.*  FROM magodmis.order_details o WHERE o.Order_No ='${orderno}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});
// getting Customer ORder Invoice data
customerRouter.post(`/orderinvoices`, async (req, res, next) => {
  try {
    console.log(req.body);
    const orderno = req.body.orderno;
    misQueryMod(
      `SELECT n.* FROM magodmis.draft_dc_inv_register n, magodmis.orderschedule o 
        WHERE n.ScheduleID=o.ScheduleID AND o.Order_No ='${orderno}'`,
      (err, data) => {
        if (err) logger.error(err);
        console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

customerRouter.post(`/orderinvdwg`, async (req, res, next) => {
  console.log(req.body);
  console.log("Order Invoices DWG");
  try {
    const dcinvno = req.body.dcinvno;
    misQueryMod(
      `SELECT * FROM magodmis.draft_dc_inv_details d WHERE d.DC_Inv_No= '${dcinvno}'`,
      (err, data) => {
        if (err) logger.error(err);
        console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});
customerRouter.post(`/schdets`, async (req, res, next) => {
  console.log(req.body);

  try {
    const scheduleid = req.body.ordschid;
    misQueryMod(
      `SELECT n.* FROM magodmis.orderscheduledetails n WHERE n.ScheduleID='${scheduleid}'`,
      (err, data) => {
        if (err) logger.error(err);
        console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

customerRouter.post(`/schtasksdets`, async (req, res, next) => {
  try {
    const nctaskid = req.body.nctaskid;
    misQueryMod(
      `SELECT t.* FROM magodmis.task_partslist t WHERE t.NcTaskId='${nctaskid}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

customerRouter.post(`/printduereport`, async (req, res, next) => {
  console.log("Print Due Report ");
  try {
    const custcode = req.body.custcode;
    // const DueAmt = req.body.dueAmount;
    // const OverDue = req.body.overDue;

    if (!custcode) return res.send(createError.BadRequest());
    // misQuery(`Select Cust_name,EMail from magodmis.cust_data where cust_code = '${custcode}'`, (custdata) => {
    //     custname = custdata[0]["cust_name"];
    //     console.log("Name : " + JSON.stringify(custdata))

    misQueryMod(
      `Select  case when DueDays > 365 then Sum(Balance) else 0 end as overDue,
        case when DueDays < 356 then Sum(Balance) else 0 end as dueamount
        from (SELECT DateDiff(Curdate(),d.Inv_Date) as DueDays,d.PymtAmtRecd,Cust_Code,(d.GrandTotal - d.PymtAmtRecd) as Balance
        FROM magodmis.draft_dc_inv_register d  WHERE  d.DCStatus='Despatched' AND d.Cust_Code='${custcode}'
        and d.GrandTotal > d.PymtAmtRecd ) a`,
      (err, duestypedata) => {
        if (err) logger.error(err);
        console.log(" dues data " + JSON.stringify(duestypedata));

        misQueryMod(
          `SELECT DateDiff(Curdate(),d.Inv_Date) as DueDays,DC_Inv_No,IsDC,DATE_FORMAT(Dc_inv_Date, "%d/%l/%Y") AS 'Dc_inv_Date' ,DC_InvType,
                InvoiceFor,DC_No,DATE_FORMAT(DC_Date,"%d/%l/%Y") as 'DC_Date', Inv_No,DATE_FORMAT(Inv_Date,"%d/%l/%Y") as 'Inv_Date',PaymentDate,
                PymtAmtRecd,PaymentMode,GRNNo,Cust_Code,Cust_Name,PO_No, PO_Date, 
                Net_Total,InvTotal,Round_Off,GrandTotal,(GrandTotal - PymtAmtRecd) as Balance,Total_Wt,
                SummaryInvoice,BillType FROM magodmis.draft_dc_inv_register d 
                WHERE  d.DCStatus='Despatched' AND d.Cust_Code='${custcode}' ORDER BY d.Inv_Date`,
          (err, duedata) => {
            if (err) logger.error(err);
            console.log("due data " + duedata);
            sendDueList(custdata, duestypedata, duedata, (err, data) => {
              if (err) logger.error(err);
              console.log(data);
            });
          }
        );
      }
    );
    // });
  } catch (error) {
    next(error);
  }
});
// geting customer material stock position data
customerRouter.post(`/customermtrlstock`, async (req, res, next) => {
  try {
    const custcode = req.body.custcode;

    if (!custcode) return res.send(createError.BadRequest());

    misQueryMod(
      `SELECT MtrlStockID, count( MtrlStockID) as inStock,Cust_Docu_No, Mtrl_Code, DynamicPara1, DynamicPara2,Locked, Scrap 
                    FROM magodmis.mtrlstocklist  WHERE Cust_Code='${custcode}' 
                GROUP BY Mtrl_Code, DynamicPara1, DynamicPara2,Scrap, Locked ORDER BY  Locked DESC,Scrap DESC`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

customerRouter.post(`/getmtrlrvlist`, async (req, res, next) => {
  try {
    const type = req.body.Type;
    const status = req.body.Status;
    const source = req.body.Source;
    const ccode = req.body.custcode;
    console.log(type, status, source);

    if (!type || !status || !source) return res.send(createError.BadRequest());
    if (ccode == "") {
      if (source == "Magod") {
        misQueryMod(
          `SELECT * FROM magodmis.material_receipt_register m WHERE m.Type='${type}' 
                        AND m.RVStatus='${status}' and m.Cust_Code like '0000' ORDER BY  m.RVId Desc`,
          (err, data) => {
            if (err) logger.error(err);
            res.send(data);
          }
        );
      } else {
        misQueryMod(
          `SELECT * FROM magodmis.material_receipt_register m WHERE m.Type='${type}' 
                        AND m.RVStatus='${status}' and m.Cust_Code not like '0000' ORDER BY  m.RVId Desc`,
          (err, data) => {
            if (err) logger.error(err);
            res.send(data);
          }
        );
      }
    } else {
      if (source == "Magod") {
        misQueryMod(
          `SELECT * FROM magodmis.material_receipt_register m WHERE m.Type='${type}' 
                        AND m.RVStatus='${status}' and m.Cust_Code like '0000' ORDER BY  m.RVId Desc`,
          (err, data) => {
            if (err) logger.error(err);
            res.send(data);
          }
        );
      } else {
        misQueryMod(
          `SELECT * FROM magodmis.material_receipt_register m WHERE m.Type='${type}' 
                        AND m.RVStatus='${status}' and m.Cust_Code = '${ccode}' ORDER BY  m.RVId Desc`,
          (err, data) => {
            if (err) logger.error(err);
            res.send(data);
          }
        );
      }
    }
  } catch (error) {
    next(error);
  }
});

// geting customer material Receipts data

customerRouter.post(`/customermtrlreceipts`, async (req, res, next) => {
  try {
    const custcode = req.body.custcode;

    if (!custcode) return res.send(createError.BadRequest());

    misQueryMod(
      `SELECT RVID,RV_No, RV_Date,  CustDocuNo, RVStatus,TotalWeight,updated, TotalCalculatedWeight 
        FROM magodmis.material_receipt_register WHERE Cust_Code='${custcode}' ORDER BY RV_Date DESC,RV_no DESC`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// geting customer material Receipts Details data
customerRouter.post(`/customermtrlrectdetails`, async (req, res, next) => {
  try {
    const rvid = req.body.rvid;

    if (!rvid) return res.send(createError.BadRequest());

    misQueryMod(
      `SELECT rvID, Mtrl_Code,DynamicPara1, DynamicPara2, Qty,updated FROM magodmis.mtrlreceiptdetails  WHERE rvID= '${rvid}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// geting customer material Parts Returned data
customerRouter.post(`/customermtrlpartsreturned`, async (req, res, next) => {
  try {
    const custcode = req.body.custcode;

    if (!custcode) return res.send(createError.BadRequest());

    misQueryMod(
      `SELECT d.DC_InvType, d.Inv_No, d.Inv_Date, d1.Material, sum(d1.SrlWt) as SrlWt FROM magodmis.draft_dc_inv_register d, magodmis.dc_inv_summary d1 WHERE d.Cust_Code='${custcode}' AND (d.DCStatus='Closed' Or d.DCStatus='Despatched') AND d.DC_Inv_No=d1.DC_Inv_No AND d.DC_InvType='Job Work' GROUP BY d1.Material, d.Inv_Date, d.Inv_No ORDER BY d.Inv_Date Desc, d.Inv_No Desc`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

customerRouter.post(`/updatebomassembly`, async (req, res, next) => {
  console.log("Update Assm details");
  try {
    const mmagodid = req.body.mmagodid;
    const asmstatus = req.body.assmstatus;
    const asmdesc = req.body.assmdesc;
    const mtrlcost = req.body.mtrlcost;
    const jbwrkcost = req.body.jobworkcost;
    misQueryMod(
      `Select * from magodmis.cust_assy_data where MagodCode='${mmagodid}'`,
      (err, data) => {
        if (err) logger.error(err);
        if (data.length > 0) {
          misQueryMod(
            `Update magodmis.cust_assy_data set Status='${asmstatus}',AssyDescription = '${asmdesc}',MtrlCost='${mtrlcost}',JobWorkCost='${jbwrkcost}' where MagodCode='${mmagodid}'`,
            (err, bomasmdata) => {
              if (err) logger.error(err);
              res.send({ status: "success" });
            }
          );
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

customerRouter.post(`/deletebomassmparts`, async (req, res, next) => {
  console.log("Deleting Parts ");
  try {
    const asmid = req.body.assmid;
    const asmpart = req.body.assmpartid;
    misQueryMod(
      `Select assytbl.Id as assyid from magodmis.cust_assy_data assytbl where AssyCust_PartId = '${asmid}'`,
      (err, asmdata) => {
        if (err) logger.error(err);
        console.log(asmdata);
        console.log(asmdata[0].assyid);
        console.log(asmpart);
        misQueryMod(
          `SELECT bomlist.Id FROM magodmis.cust_bomlist as bomlist where PartId = '${asmpart}'`,
          (err, asmprtdata) => {
            if (err) logger.error(err);
            console.log("asmprtdata " + asmprtdata[0].Id);
            misQueryMod(
              `Delete from magodmis.cust_assy_bom_list  where Cust_AssyId ='${asmdata[0].assyid}' and Cust_Bom_ListId='${asmprtdata[0].Id}'`,
              (err, deldata) => {
                if (err) logger.error(err);
              }
            );
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

// geting customer material Parts Returned data
customerRouter.post(
  `/customermtrlscrapUnusedreturned`,
  async (req, res, next) => {
    console.log("Scrap mtrl");
    try {
      const custcode = req.body.custcode;
      if (!custcode) return res.send(createError.BadRequest());

      misQueryMod(
        `SELECT d.DC_No, d.DC_Date, d1.Material, sum(d1.DC_Srl_Wt) as Total_Wt FROM magodmis.dc_register d
        inner join magodmis.dc_details d1 on d1.DC_ID=d.DC_ID
                            WHERE d.DC_Type='Material Return' AND d.Cust_Code='${custcode}'
                            GROUP BY d1.Material, d.DC_No, d.DC_Date ORDER BY d.DC_Date , d.DC_No desc`,
        (err, data) => {
          if (err) logger.error(err);
          //   console.log("scrap : " + data);
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

// Customer Invoice and Payment Receipts data
customerRouter.post(`/customerduelist`, async (req, res, next) => {
  console.log(req.body);
  try {
    const custcode = req.body.custcode;
    if (!custcode) return res.send(createError.BadRequest());

    misQueryMod(
      `SELECT DateDiff(Curdate(),d.Inv_Date) as DueDays,DC_Inv_No,IsDC,ScheduleId,DATE_FORMAT(Dc_inv_Date, "%d/%l/%Y") AS 'Dc_inv_Date' ,DC_InvType,
        InvoiceFor,OrderNo,OrderScheduleNo,OrderDate,DC_No,DATE_FORMAT(DC_Date,"%d/%l/%Y") as 'DC_Date',
        DC_Fin_Year,Inv_No,DATE_FORMAT(Inv_Date,"%d/%l/%Y") as 'Inv_Date',Inv_Fin_Year,DATE_FORMAT(PaymentDate,"%d/%l%/%Y") as 'PaymentDate',
        PmnyRecd,PymtAmtRecd,PaymentMode,PaymentReceiptDetails,GRNNo,Cust_Code,Cust_Name,Cust_Address,Cust_Place,Cust_State,Cust_StateId,
        PIN_Code,Del_Address,Del_StateId,ECC_No,GSTNo,TIN_No,KST_No,CST_No,PO_No, PO_Date, Net_Total,Pkng_chg,TptCharges,PN_PkngLevel,Discount,
        Pgm_Dft_Chg,   MtrlChg,AssessableValue,TaxAmount,Del_Chg,InvTotal,Round_Off,GrandTotal,(GrandTotal - PymtAmtRecd) as Balance,Total_Wt,
        ScarpWt,DCStatus,CenvatSrlNo,DespatchDate,DespatchTime,TptMode,VehNo,EWayBillRef,ExChapterHead,ExNotNo,DelDC_Inv,InspBy,PackedBy,
        Com_inv_id, Remarks,PO_Value,FB_Qty,FB_Quality,FB_Delivery,FB_Remarks,Del_responsibility,
        PaymentTerms,pkngLevel,SummaryInvoice,BillType,Sync_HOId,PAN_No,ST_No FROM magodmis.draft_dc_inv_register d 
        WHERE  d.DCStatus='Despatched' AND d.Cust_Code='${custcode}' ORDER BY d.Inv_Date`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

customerRouter.post(`/customeroverduelist`, async (req, res, next) => {
  console.log(req.body);
  try {
    const custcode = req.body.custcode;
    const custcr = req.body.crdays;
    if (!custcode) return res.send(createError.BadRequest());

    misQueryMod(
      `SELECT DateDiff(Curdate(),d.Inv_Date) as DueDays,DC_Inv_No,IsDC,ScheduleId,DATE_FORMAT(Dc_inv_Date, "%d/%l/%Y") AS 'Dc_inv_Date' ,DC_InvType,
        InvoiceFor,OrderNo,OrderScheduleNo,OrderDate,DC_No,DATE_FORMAT(DC_Date,"%d/%l/%Y") as 'DC_Date',
        DC_Fin_Year,Inv_No,DATE_FORMAT(Inv_Date,"%d/%l/%Y") as 'Inv_Date',Inv_Fin_Year,DATE_FORMAT(PaymentDate,"%d/%l%/%Y") as 'PaymentDate',
        PmnyRecd,PymtAmtRecd,PaymentMode,PaymentReceiptDetails,GRNNo,Cust_Code,Cust_Name,Cust_Address,Cust_Place,Cust_State,Cust_StateId,
        PIN_Code,Del_Address,Del_StateId,ECC_No,GSTNo,TIN_No,KST_No,CST_No,PO_No, PO_Date, Net_Total,Pkng_chg,TptCharges,PN_PkngLevel,Discount,
        Pgm_Dft_Chg,   MtrlChg,AssessableValue,TaxAmount,Del_Chg,InvTotal,Round_Off,GrandTotal,(GrandTotal - PymtAmtRecd) as Balance,Total_Wt,
        ScarpWt,DCStatus,CenvatSrlNo,DespatchDate,DespatchTime,TptMode,VehNo,EWayBillRef,ExChapterHead,ExNotNo,DelDC_Inv,InspBy,PackedBy,
        Com_inv_id, Remarks,PO_Value,FB_Qty,FB_Quality,FB_Delivery,FB_Remarks,Del_responsibility,
        PaymentTerms,pkngLevel,SummaryInvoice,BillType,Sync_HOId,PAN_No,ST_No FROM magodmis.draft_dc_inv_register d 
        WHERE  d.DCStatus='Despatched' AND d.Cust_Code='${custcode}' and DateDiff(Curdate(),d.Inv_Date) > '${custcr}'  ORDER BY d.Inv_Date`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// Customer - Dues and overdues data
customerRouter.post(`/customerduesoverdues`, async (req, res, next) => {
  try {
    const custcode = req.body.custcode;
    if (!custcode) return res.send(createError.BadRequest());

    // misQueryMod(`Select  case when DueDays > 365 then Sum(Balance) else 0 end as overDue,
    // case when DueDays < 356 then Sum(Balance) else 0 end as dueamount
    // from (SELECT DateDiff(Curdate(),d.Inv_Date) as DueDays,d.PymtAmtRecd,Cust_Code,(d.GrandTotal - d.PymtAmtRecd) as Balance
    // FROM magodmis.draft_dc_inv_register d  WHERE  d.DCStatus='Despatched' AND d.Cust_Code='${custcode}'
    // and d.GrandTotal > d.PymtAmtRecd ) a`, (err, data) => {
    misQueryMod(
      `Select  case when DueDays > crdays then Sum(Balance) else 0 end as overDue,
            case when DueDays > 0 then Sum(Balance) else 0 end as dueAmount
            from (SELECT DateDiff(Curdate(),d.Inv_Date) as DueDays,(Select CreditTime from magodmis.cust_data where cust_Code = '${custcode}') as crdays
            ,d.PymtAmtRecd,Cust_Code,(d.GrandTotal - d.PymtAmtRecd) as Balance
            FROM magodmis.draft_dc_inv_register d  WHERE  d.DCStatus='Despatched' AND d.Cust_Code='${custcode}'
            and d.GrandTotal > d.PymtAmtRecd ) a`,
      (err, data) => {
        if (err) logger.error(err);
        console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// Customer - Part Payment Duelist data
customerRouter.post(`/pprcustomerduelist`, async (req, res, next) => {
  console.log(req.body);
  try {
    const custcode = req.body.custcode;
    if (!custcode) return res.send(createError.BadRequest());

    misQueryMod(
      `SELECT DateDiff(Curdate(),d.Inv_Date) as DueDays,DC_Inv_No,IsDC,ScheduleId,DATE_FORMAT(Dc_inv_Date, "%d/%l/%Y") AS 'Dc_inv_Date' ,DC_InvType,
        InvoiceFor,OrderNo,OrderScheduleNo,OrderDate,DC_No,DATE_FORMAT(DC_Date,"%d/%l/%Y") as 'DC_Date',
        DC_Fin_Year,Inv_No,DATE_FORMAT(Inv_Date,"%d/%l/%Y") as 'Inv_Date',Inv_Fin_Year,DATE_FORMAT(PaymentDate,"%d/%l%/%Y") as 'PaymentDate',
        PmnyRecd,PymtAmtRecd,PaymentMode,PaymentReceiptDetails,GRNNo,Cust_Code,Cust_Name,
        PO_No, PO_Date, Net_Total,Pkng_chg,TptCharges,PN_PkngLevel,Discount,
        Pgm_Dft_Chg,InvTotal,Round_Off,GrandTotal,(GrandTotal - PymtAmtRecd) as Balance,Total_Wt,
        DelDC_Inv, Com_inv_id, Remarks,PO_Value,FB_Qty,FB_Quality,FB_Delivery,FB_Remarks,Del_responsibility,
        PaymentTerms,pkngLevel,SummaryInvoice,BillType,Sync_HOId,PAN_No,ST_No FROM magodmis.draft_dc_inv_register d 
        WHERE  d.DCStatus='Despatched' AND d.Cust_Code='${custcode}' and d.PymtAmtRecd > 0 and d.GrandTotal > d.PymtAmtRecd
         ORDER BY d.Inv_Date`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Sned mails

customerRouter.post(`/sendmailwithattachment`, async (req, res, next) => {
  console.log("Send Mails with Attachment");
  try {
    const mailto = req.body.to;
    const copyto = req.body.cc;
    const mailsub = req.body.subject;
    const attachments = req.body.attachments;
    const mailbody = req.body.mailbody;

    sendDueList(custdata, duestypedata, duedata, (err, data) => {
      if (err) logger.error(err);
      console.log(data);
    });
  } catch (error) {
    next(error);
  }
});

// Customer Invoice form data from dc_invno
customerRouter.post(`/customerdlinvform`, async (req, res, next) => {
  console.log(req.body);
  try {
    const dcinvno = req.body.dcinvno;
    if (!dcinvno) return res.send(createError.BadRequest());

    misQueryMod(
      `SELECT * FROM magodmis.draft_dc_inv_details d WHERE d.Dc_Inv_No='${dcinvno}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// Customer Invoice form data from dc_invno - Tax Details
customerRouter.post(`/customerdlinvformtaxdets`, async (req, res, next) => {
  console.log(req.body);
  try {
    const dcinvno = req.body.dcinvno;
    if (!dcinvno) return res.send(createError.BadRequest());

    misQueryMod(
      `SELECT * FROM magodmis.dc_inv_taxtable d WHERE d.Dc_Inv_No='${dcinvno}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// Customer Dues Summary
customerRouter.post(`/customerduessummary`, async (req, res, next) => {
  console.log(req.body);
  try {
    const custcode = req.body.custcode;
    if (!custcode) return res.send(createError.BadRequest());

    misQueryMod(
      `Select Sum(DueAmt30) as DueAmt30, Sum(DueAmt60) as DueAmt60, Sum(DueAmt90) as DueAmt90, Sum(DueAmt180) as DueAmt180, Sum(DueAmt365) as DueAmt365, Sum(DueAmtAbv365) as DueAmtAbv365 from
        (SELECT dd.Cust_Code,
            CASE
                WHEN (DateDiff(Curdate(),dd.PaymentDate) <= 30) THEN (dd.GrandTotal - dd.PymtAmtRecd) 
                ELSE 0
            END AS DueAmt30,
           CASE
                WHEN ((DateDiff(Curdate(),dd.PaymentDate) > 30) and (DateDiff(Curdate(),dd.PaymentDate) <= 60))
                THEN (dd.GrandTotal - dd.PymtAmtRecd) 
                ELSE 0
            END AS DueAmt60,
             CASE
                WHEN ((DateDiff(Curdate(),dd.PaymentDate) > 60) and (DateDiff(Curdate(),dd.PaymentDate) <= 90))
                THEN (dd.GrandTotal - dd.PymtAmtRecd) 
                ELSE 0
            END AS DueAmt90,
             CASE
                WHEN ((DateDiff(Curdate(),dd.PaymentDate) > 90) and (DateDiff(Curdate(),dd.PaymentDate) <= 180))
                THEN (dd.GrandTotal - dd.PymtAmtRecd) 
                ELSE 0
            END AS DueAmt180,
             CASE
                WHEN ((DateDiff(Curdate(),dd.PaymentDate) > 180) and (DateDiff(Curdate(),dd.PaymentDate) <= 365))
                THEN (dd.GrandTotal - dd.PymtAmtRecd) 
                ELSE 0
            END AS DueAmt365,
             CASE
                WHEN (DateDiff(Curdate(),dd.PaymentDate) > 365) THEN (dd.GrandTotal - dd.PymtAmtRecd) 
                ELSE 0
            END AS DueAmtAbv365
           FROM magodmis.draft_dc_inv_register dd
        where (dd.PymtAmtRecd < dd.GrandTotal) and dd.Cust_Code ='${custcode}' and dd.DCStatus='Despatched') ab
        Group by Cust_Code`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});
// Customers Outstanding Summary

customerRouter.post(`/customeroutstandings`, async (req, res, next) => {
  console.log(req.body);
  try {
    //        const custcode = req.body.custcode;
    //      if (!custcode) return res.send(createError.BadRequest())

    //     `select ab.Cust_Code,ab.Cust_Name, Sum(DueAmt30 + DueAmt60 + DueAmt90 + DueAmt180 + DueAmt365 + DueAmtAbv365) as TotalDues,
    //     Sum(DueAmt30) as DueAmt30, Sum(DueAmt60) as DueAmt60, Sum(DueAmt90) as DueAmt90,
    //    Sum(DueAmt180) as DueAmt180, Sum(DueAmt365) as DueAmt365, Sum(DueAmtAbv365) as DueAmtAbv365 from
    //    (SELECT dd.Cust_Code,c.Cust_Name,
    //        CASE
    //            WHEN (DateDiff(Curdate(),dd.PaymentDate) <= 30) THEN (dd.GrandTotal - dd.PymtAmtRecd)
    //            ELSE 0
    //        END AS DueAmt30,
    //       CASE
    //            WHEN ((DateDiff(Curdate(),dd.PaymentDate) > 30) and (DateDiff(Curdate(),dd.PaymentDate) <= 60))
    //            THEN (dd.GrandTotal - dd.PymtAmtRecd)
    //            ELSE 0
    //        END AS DueAmt60,
    //         CASE
    //            WHEN ((DateDiff(Curdate(),dd.PaymentDate) > 60) and (DateDiff(Curdate(),dd.PaymentDate) <= 90))
    //            THEN (dd.GrandTotal - dd.PymtAmtRecd)
    //            ELSE 0
    //        END AS DueAmt90,
    //         CASE
    //            WHEN ((DateDiff(Curdate(),dd.PaymentDate) > 90) and (DateDiff(Curdate(),dd.PaymentDate) <= 180))
    //            THEN (dd.GrandTotal - dd.PymtAmtRecd)
    //            ELSE 0
    //        END AS DueAmt180,
    //         CASE
    //            WHEN ((DateDiff(Curdate(),dd.PaymentDate) > 180) and (DateDiff(Curdate(),dd.PaymentDate) <= 365))
    //            THEN (dd.GrandTotal - dd.PymtAmtRecd)
    //            ELSE 0
    //        END AS DueAmt365,
    //         CASE
    //            WHEN (DateDiff(Curdate(),dd.PaymentDate) > 365) THEN (dd.GrandTotal - dd.PymtAmtRecd)
    //            ELSE 0
    //        END AS DueAmtAbv365
    //       FROM magodmis.draft_dc_inv_register dd
    //    left outer join magodmis.cust_data c on c.Cust_Code = dd.Cust_Code
    //    where (dd.PymtAmtRecd < dd.GrandTotal) ) ab
    //    where DueAmt30 > 0 or DueAmt60 >0 or DueAmt90 >0 or DueAmt180 > 0 or DueAmt365> 0 or DueAmtAbv365 > 0
    //    Group by Cust_Code Order by Cust_Name asc`

    misQueryMod(
      `select ab.Cust_Code,ab.Cust_Name, Sum(DueAmt30 + DueAmt60 + DueAmt90 + DueAmt180 + DueAmt365 + DueAmtAbv365) as TotalDues,
        Sum(DueAmt30) as DueAmt30, Sum(DueAmt60) as DueAmt60, Sum(DueAmt90) as DueAmt90, 
       Sum(DueAmt180) as DueAmt180, Sum(DueAmt365) as DueAmt365, Sum(DueAmtAbv365) as DueAmtAbv365 from
       (SELECT dd.Cust_Code,c.Cust_Name,c.CreditTime,
           CASE
               WHEN (DateDiff(Curdate(),dd.inv_date) <= 30) THEN (dd.GrandTotal - dd.PymtAmtRecd) 
               ELSE 0
           END AS DueAmt30,
          CASE
               WHEN ((DateDiff(Curdate(),dd.inv_date) > 30) and (DateDiff(Curdate(),dd.inv_date) <= 60))
               THEN (dd.GrandTotal - dd.PymtAmtRecd) 
               ELSE 0
           END AS DueAmt60,
            CASE
               WHEN ((DateDiff(Curdate(),dd.inv_date) > 60) and (DateDiff(Curdate(),dd.inv_date) <= 90))
               THEN (dd.GrandTotal - dd.PymtAmtRecd) 
               ELSE 0
           END AS DueAmt90,
            CASE
               WHEN ((DateDiff(Curdate(),dd.inv_date) > 90) and (DateDiff(Curdate(),dd.inv_date) <= 180))
               THEN (dd.GrandTotal - dd.PymtAmtRecd) 
               ELSE 0
           END AS DueAmt180,
            CASE
               WHEN ((DateDiff(Curdate(),dd.inv_date) > 180) and (DateDiff(Curdate(),dd.inv_date) <= 365))
               THEN (dd.GrandTotal - dd.PymtAmtRecd) 
               ELSE 0
           END AS DueAmt365,
            CASE
               WHEN (DateDiff(Curdate(),dd.inv_date) > 365) THEN (dd.GrandTotal - dd.PymtAmtRecd) 
               ELSE 0
           END AS DueAmtAbv365
          FROM magodmis.draft_dc_inv_register dd 
       left outer join magodmis.cust_data c on c.Cust_Code = dd.Cust_Code 
       where (dd.PymtAmtRecd < dd.GrandTotal) ) ab
       where DueAmt30 > 0 or DueAmt60 >0 or DueAmt90 >0 or DueAmt180 > 0 or DueAmt365> 0 or DueAmtAbv365 > 0
       Group by Cust_Code Order by Cust_Name asc`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});
// customer outstanding invoices

customerRouter.post(`/outstandinginvoices`, async (req, res, next) => {
  console.log(req.body);
  try {
    const custcode = req.body.custcode;
    if (!custcode) return res.send(createError.BadRequest());

    misQueryMod(
      `SELECT ddir.Inv_No,ddir.Inv_Date, ddir.GrandTotal, ddir.PymtAmtRecd, (ddir.GrandTotal - ddir.PymtAmtRecd) as Due, 
        datediff(current_date(),ddir.Inv_Date) as DueDays, ddir.PO_No,c.credittime FROM magodmis.draft_dc_inv_register ddir
        inner join magodmis.cust_data c on c.Cust_code = ddir.Cust_Code
        WHERE  ddir.DCStatus ='Despatched' AND ddir.Cust_Code='${custcode}' ORDER BY ddir.Inv_Date`,
      (err, data) => {
        if (err) logger.error(err);
        console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});
// Customer Receipts Info
customerRouter.post(`/customerreceiptsinfo`, async (req, res, next) => {
  console.log(req.body);
  try {
    const custcode = req.body.custcode;
    if (!custcode) return res.send(createError.BadRequest());

    misQueryMod(
      `SELECT * FROM magodmis.payment_recd_voucher_register p WHERE p.Cust_code='${custcode}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// Customer Receipts Details
customerRouter.post(`/customerreceiptdets`, async (req, res, next) => {
  console.log(req.body);
  try {
    const recdpvid = req.body.recdpvid;
    if (!recdpvid) return res.send(createError.BadRequest());

    misQueryMod(
      `SELECT * FROM magodmis.payment_recd_voucher_details p WHERE p.RecdPVID='${recdpvid}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = customerRouter;
