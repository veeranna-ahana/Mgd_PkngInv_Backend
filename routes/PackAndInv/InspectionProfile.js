const inspectionProfileRouter = require("express").Router();
var createError = require("http-errors");
const { createFolder, copyallfiles } = require("../../helpers/folderhelper");
const { misQuery, setupQuery, misQueryMod } = require("../../helpers/dbconn");
const req = require("express/lib/request");
const { sendDueList } = require("../../helpers/sendmail");
const { logger } = require("../../helpers/logger");

inspectionProfileRouter.get("/allcustomerdata", async (req, res, next) => {
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

inspectionProfileRouter.post("/getorderschdata", async (req, res, next) => {
  // console.log("req", req.body);
  // let custcode = req.body;
  let cust_code = req.body.custCode;
  let selectedOption = req.body.selectedOption;

  //  console.log("custcode", cust_code);

  try {
    misQueryMod(
      `SELECT 
              *
        FROM
            magodmis.orderschedule
        WHERE
            NOT (Schedule_Status LIKE 'Created'
                OR Schedule_Status LIKE 'Dispatched'
                OR Schedule_Status LIKE 'Closed'
                OR Schedule_Status LIKE 'Cancelled'
                OR Schedule_Status LIKE 'Ready'
                OR Schedule_Status LIKE 'Suspended')
                AND ScheduleType NOT LIKE 'Combined'
                AND Type = '${selectedOption}'
                AND Cust_code = '${cust_code}'
        ORDER BY ScheduleDate DESC`,
      (err, data) => {
        if (err) logger.error(err);

        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

inspectionProfileRouter.post("/updateSchDetails", async (req, res, next) => {
  // console.log("req_body", req.body);
  for (let i = 0; i < req.body.length; i++) {
    // console.log("req.body[i].QtyProduced", req.body[i].QtyProduced);
    console.log("req.body[i].QtyCleared", req.body[i].QtyCleared);
    // console.log("req.body[i].SchDetaildsId", req.body[i].SchDetailsID);
    try {
      misQueryMod(
        `UPDATE magodmis.orderscheduledetails o 
          SET o.QtyProduced='${req.body[i].QtyProduced}', o.QtyCleared='${req.body[i].QtyCleared}' 
          WHERE o.SchDetailsId='${req.body[i].SchDetailsID}'
           `,

        (err, response) => {
          if (err) logger.error(err);

          // console.log('updateRatesPN', response);

          // response.JSON(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
  //  console.log("updated succesfully");
  res.send("Set Rate Successful");
});

inspectionProfileRouter.post(
  "/getorderschforschdetails",
  async (req, res, next) => {
    //  console.log("requset", req.body);
    // let custcode = req.body;
    let cust_code = req.body.custCode;
    let selectedOption = req.body.selectedOption;
    let ScheduleId = req.body.ScheduleId;
    //  console.log("custcode", cust_code);
    //  console.log("selectedOption", selectedOption);
    //  console.log("ScheduleId:", ScheduleId);

    try {
      misQueryMod(
        `  SELECT o.*, IF(a.InDraftPn IS NULL, 0, a.InDraftPn) AS InDraftPn
      FROM magodmis.orderscheduledetails o
      LEFT JOIN (
          SELECT d.ScheduleId, SUM(d1.Qty) AS InDraftPN, d1.OrderSchDetailsID
          FROM magodmis.draft_dc_inv_register d
          LEFT JOIN magodmis.draft_dc_inv_details d1 ON d1.DC_Inv_No = d.DC_Inv_No
          WHERE d.DCStatus = 'Draft' AND d.ScheduleId = @ScheduleId AND d1.OrderSchDetailsID IS NOT NULL
          GROUP BY d.ScheduleId, d1.OrderSchDetailsID
      ) AS a ON a.OrderSchDetailsID = o.SchDetailsID
      WHERE o.ScheduleId = '${ScheduleId}' and Cust_Code='${cust_code}'`,

        // o.ScheduleId = '57739' and Cust_Code='2252'
        (err, data) => {
          if (err) logger.error(err);

          //  console.log("data", data);
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

inspectionProfileRouter.post(
  "/getprorejectionsdetails",

  async (req, res, next) => {
    // console.log("requset", req.body);
    // let custcode = req.body;
    // let cust_code = req.body.custCode;
    // let selectedOption = req.body.selectedOption;
    // let ScheduleId = req.body.ScheduleId;
    // console.log("custcode", cust_code);
    // console.log("selectedOption", selectedOption);
    // console.log("ScheduleId:", ScheduleId);

    try {
      misQueryMod(
        ` SELECT * FROM magodmis.rejectionslist r WHERE r.ScheduleId='58015'`,

        // o.ScheduleId = '57739' and Cust_Code='2252'
        (err, data) => {
          if (err) logger.error(err);

          //  console.log("data", data);
          res.send(data);
          try {
            misQueryMod(
              ` SELECT i.* FROM magodmis.rejectionslist r,magodmis.internal_rejectionpartslist i WHERE r.ScheduleId='' AND i.Rej_Id=''`,

              // o.ScheduleId = '57739' and Cust_Code='2252'
              (err, data) => {
                if (err) logger.error(err);

                //  console.log("data", data);
                res.send(data);
              }
            );
          } catch (error) {
            next(error);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

inspectionProfileRouter.post(`/getpackingschedules`, async (req, res, next) => {
  try {
    let intype = req.body.instype;
    let ccode = req.body.ccode;
    //  console.log(intype);

    misQueryMod(
      `SELECT o.* FROM magodmis.orderschedule o
        WHERE Not(o.Schedule_Status like 'Created' or o.Schedule_Status like 'Dispatched' 
        or o.Schedule_Status like 'Closed' OR o.Schedule_Status like 'Cancelled' OR o.Schedule_Status like 'Ready'
         OR o.Schedule_Status like 'Suspended'  )  AND o.ScheduleType not like 'Combined'  
        AND o.Type = '${intype}'  AND o.Cust_code= '${ccode}' ORDER BY o.ScheduleDate desc`,
      async (err, data) => {
        if (err) {
          //  console.log(err);
          res.status(500).send(err);
        }
        //  console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

inspectionProfileRouter.post(`/getpackschdetails`, async (req, res, next) => {
  try {
    let schid = req.body.scheduleid;

    misQueryMod(
      `SELECT o.*,c.cust_name FROM magodmis.orderschedule o, magodmis.cust_data c 
           WHERE o.ScheduleId = '${schid}' AND c.Cust_code=o.Cust_Code`,
      async (err, data) => {
        if (err) {
          //  console.log(err);
          res.status(500).send(err);
        }
        //  console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

inspectionProfileRouter.post(`/getexnotifications`, async (req, res, next) => {
  try {
    // let schid = req.body.scheduleid;

    setupQuery(`SELECT * FROM magod_setup.exnotifications`, async (data) => {
      //  console.log(data);
      res.send(data);
    });
  } catch (error) {
    next(error);
  }
});

inspectionProfileRouter.post(
  `/getpckscheduledetails`,
  async (req, res, next) => {
    try {
      let schdetsid = req.body.scheduleid;
      // console.log("schdetsid", schdetsid);

      setupQuery(
        `SELECT o.*,if (a.InDraftPn is null,0,a.InDraftPn) as InDraftPn FROM magodmis.orderscheduledetails o LEFT JOIN 
        (SELECT  d.ScheduleId, sum(d1.Qty) as InDraftPN, d1.OrderSchDetailsID
        FROM magodmis.draft_dc_inv_register d left join magodmis.draft_dc_inv_details d1 on  d1.DC_Inv_No = d.DC_Inv_No
        WHERE d.DCStatus='Draft'  AND d.ScheduleId ='${schdetsid}' AND d1.OrderSchDetailsID is not null 
        GROUP BY d1.OrderSchDetailsID) as a on a.OrderSchDetailsID=o.SchDetailsID WHERE o.ScheduleId ='${schdetsid}'`,
        async (data) => {
          // console.log("data..........................");
          //  console.log(data);
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//-------new-------------------------

// inspectionProfileRouter.post("/postInvoiceData", async (req, res, next) => {
//   // console.log("post dta", req.body);
//   // console.log("into backend.......", req.body.SelectedTaxes);
//   // console.log("...........");

//   // const today = new Date();
//   // var billType = "DC";
//   // var paymentTerms = "Cash of Delivery";
//   // var paymentMode = "Cash";

//   // console.log("today", today.toISOString().split("T")[0]);

//   // var dispatchDate = today.toISOString().split("T")[0];

//   // console.log("reqqqqqqqqqqqq", req.body);

//   // if (req.body.primary.dispatchDate.length > 0) {
//   //   dispatchDate = req.body.primary?.dispatchDate;
//   // }
//   // if (req.body.primary.billType.length > 0) {
//   //   billType = req.body.primary?.billType;
//   //   paymentMode = req.body.primary?.billType;
//   //   paymentTerms = req.body.primary?.creditDays;
//   // }

//   // const PNStatus = "Packed";

//   // res.send("done.........");
//   try {
//     misQueryMod(
//       `SELECT
//             DC_No
//         FROM
//             magodmis.draft_dc_inv_register
//         WHERE
//             DC_No IS NOT NULL AND DC_No != 'null'
//                 AND DC_No != ''
//                 AND DC_No != 'NaN'
//         ORDER BY DC_Inv_No DESC
//         LIMIT 1`,
//       (err, DC_No_data) => {
//         if (err) logger.error(err);

//       //  console.log("data1", data);

//         // insert data into register 2023-07-21T09:39:04.886Z 2023-07-21T09:49:50.000Z

//         try {
//           misQueryMod(
//             `insert into magodmis.draft_dc_inv_register(
//               Dc_inv_Date,DC_InvType,InvoiceFor,OrderScheduleNo,DC_No,DC_Date,PymtAmtRecd,PaymentMode,BillType,PaymentTerms,PaymentReceiptDetails,Cust_Code,Cust_Name,Cust_Address,Cust_Place,Cust_State,PIN_Code,Del_Address,GSTNo,PO_No,PO_Date,Net_Total,Discount,TaxAmount,Del_Chg,InvTotal,Round_Off,GrandTotal,DCStatus,DespatchDate,TptMode,VehNo,Remarks )
//             values(
//               now(),'${req.body.primary.invoiceForm}','${
//               req.body.primary.invoiceForm.split(" ")[0]
//             }',
//               '${req.body.primary.invoiceForm.split(" ")[0]}','${
//               parseInt(DC_No_data[0].DC_No) + 1
//             }',now(),'${
//               req.body.primary.amountReceived
//             }','${paymentMode}','${billType}',
//             '${paymentTerms}',
//             '${req.body.primary.paymentDescription}','${
//               req.body.primary.custNo
//             }','${req.body.primary.consignee}','${req.body.primary.address}','${
//               req.body.primary.district
//             }','${req.body.primary.state}','${req.body.primary.pinCode}','${
//               req.body.primary.delivery
//             }','${req.body.primary.gst}','${req.body.primary.poNo}',now(),'${
//               req.body.netTotal
//             }','${req.body.discount}','${req.body.taxAmount}','${
//               req.body.deliveryCharge
//             }','${req.body.invoiceTotal}','${req.body.roundOff}','${
//               req.body.grandTotal
//             }','${PNStatus}','${dispatchDate + " 00:00:00"}','${
//               req.body.primary.dispatchMode
//             }','${req.body.primary.vehicleNo}','${req.body.primary.remarks}')
//              `,
//             (err, registerData) => {
//               if (err) logger.error(err);
//               // console.log("register done", registerData);

//               // insert into detailssssss
//               let flag = 0;

//               for (let i = 0; i < req.body.tableRow.length; i++) {
//                 const element = req.body.tableRow[i];

//                 // console.log("elment", i + 1, element);
//                 try {
//                   misQueryMod(
//                     `insert into magodmis.draft_dc_inv_details(DC_Inv_No,DC_Inv_Srl,Cust_Code,Dwg_No,Mtrl,Qty,Unit_Wt,DC_Srl_Wt,Unit_Rate,DC_Srl_Amt,Excise_CL_no,DespStatus)
//                   values(${registerData?.insertId},${i + 1},${
//                       req.body.primary.custNo
//                     },'${element.desc}','${element.material}',${
//                       element.quantity
//                     },${element.unitWeight},${element.totalWeight},${
//                       element.unitRate
//                     },${element.totalAmount},'${
//                       element.excise
//                     }','${PNStatus}')`,
//                     (err, detailsData) => {
//                       if (err) logger.error(err);

//                       // console.log("fully done");
//                       // console.log("into details", detailsData);
//                       // console.log("done.............");

//                       // const dataCreateNew = getDataCreateNew(
//                       //   registerData?.insertId
//                       // );
//                       // res.send(dataCreateNew);

//                       // console.log("sent the data to frontend........");
//                       // console.log("after all the process", dataCreateNew);
//                       // console.log("data into post", dataCreateNew);

//                       // console.log("completed the processs................");

//                       // try {
//                       //   misQueryMod(
//                       //     ``,
//                       //     (err, selectData) => {
//                       //       if (err) logger.error(err);

//                       //     // console.log("select done", selectData);
//                       //     // console.log("done.............");

//                       //     }
//                       //   );
//                       // } catch (error) {
//                       //   next(error);
//                       // }
//                     }
//                   );
//                 } catch (error) {
//                   next(error);
//                 }
//               }

//               // console.log("selected taxes", req.body.SelectedTaxes);
//               if (req.body.SelectedTaxes?.length > 0) {
//                 for (let i = 0; i < req.body.SelectedTaxes.length; i++) {
//                   const element = req.body.SelectedTaxes[i];

//                   // console.log(
//                   //   "element......",
//                   //   element,
//                   //   "dc inv no",
//                   //   registerData?.insertId
//                   // );

//                   try {
//                     misQueryMod(
//                       `INSERT INTO magodmis.dc_inv_taxtable (Dc_inv_No,DcTaxID,TaxID, Tax_Name, TaxOn, TaxableAmount, TaxPercent, TaxAmt)
//                       VALUES (${registerData?.insertId},${i + 1},${
//                         element.taxID
//                       }, '${element.taxName}', '${element.taxOn}', ${
//                         element.taxableAmount
//                       }, ${element.taxPercentage}, ${element.taxAmount})`,
//                       (err, taxRes) => {
//                         if (err) logger.error(err);
//                         // console.log("done in tax", taxRes);
//                       }
//                     );
//                   } catch (error) {
//                     next(error);
//                   }
//                   // console.log("skjfhjsd.......", i);
//                 }
//                 flag = 1;
//               } else {
//                 flag = 1;
//               }

//               if (flag === 1) {
//                 try {
//                   misQueryMod(
//                     `SELECT
//                       *,
//                       DATE_FORMAT(DC_Date, '%d/%m/%Y') AS DC_Date,
//                       DATE_FORMAT(Inv_Date, '%d/%m/%Y') AS Inv_Date
//                     FROM
//                         magodmis.draft_dc_inv_register
//                               INNER JOIN
//                           magodmis.draft_dc_inv_details ON magodmis.draft_dc_inv_register.DC_Inv_No = magodmis.draft_dc_inv_details.DC_Inv_No
//                       WHERE
//                           magodmis.draft_dc_inv_register.DC_Inv_No = ${registerData?.insertId}`,
//                     (err, selectData) => {
//                       if (err) logger.error(err);
//                       // console.log("select data", selectData);

//                       try {
//                         misQueryMod(
//                           `SELECT * FROM magodmis.dc_inv_taxtable where Dc_inv_No = ${registerData?.insertId}`,
//                           (err, taxData) => {
//                             if (err) logger.error(err);
//                             res.send({
//                               selectData: selectData,
//                               taxData: taxData,
//                               message: "Packing Note Created Successfully",
//                               flag: flag,
//                             });
//                           }
//                         );
//                       } catch (error) {
//                         next(error);
//                       }

//                       // res.send({
//                       //   selectData: selectData,
//                       //   message: "Invoice Created Successfully",
//                       // });
//                       // console.log(".....................");
//                       // console.log("detailsData", detailsData);
//                       // res.send(selectData);
//                       // console.log("select done", selectData);
//                       // console.log("done.............");
//                       // return selectData;
//                     }
//                   );
//                 } catch (error) {
//                   next(error);
//                 }
//               } else if (flag === 0) {
//                 res.send({
//                   // selectData: selectData,
//                   // taxData: taxData,
//                   message: "Error in Backend",
//                   flag: flag,
//                 });
//               } else {
//                 res.send({
//                   message: "Uncaught Error, Check with backend",
//                   flag: flag,
//                 });
//               }
//             }
//           );
//         } catch (error) {
//           next(error);
//         }
//       }
//     );
//   } catch (error) {
//     next(error);
//   }
// });

inspectionProfileRouter.post(
  "/postInvoiceDataDetails",
  async (req, res, next) => {
    // console.log("req.body .......123", req.body.selectedRows);
    let flag = 0;

    try {
      misQueryMod(
        `SELECT 
              DC_No
          FROM
              magodmis.draft_dc_inv_register
          WHERE
              DC_No IS NOT NULL AND DC_No != 'null'
                  AND DC_No != ''
                  AND DC_No != 'NaN'
          ORDER BY DC_Inv_No DESC
          LIMIT 1`,
        (err, DC_No_data) => {
          if (err) logger.error(err);

          //  console.log("data1", DC_No_data);

          // insert data into register 2023-07-21T09:39:04.886Z 2023-07-21T09:49:50.000Z

          try {
            misQueryMod(
              `insert into magodmis.draft_dc_inv_register(
                Dc_inv_Date,DC_InvType,InvoiceFor,OrderScheduleNo,DC_No,DC_Date,PymtAmtRecd,PaymentMode,BillType,PaymentTerms,PaymentReceiptDetails,Cust_Code,Cust_Name,Cust_Address,Cust_Place,Cust_State,PIN_Code,Del_Address,GSTNo,PO_No,PO_Date,Net_Total,Discount,TaxAmount,Del_Chg,InvTotal,Round_Off,GrandTotal,DCStatus,DespatchDate,TptMode,VehNo,Remarks)
              values(
                now(),'${req.body.primary.invoiceForm}','${
                req.body.primary.invoiceForm.split(" ")[0]
              }',
                '${req.body.primary.invoiceForm.split(" ")[0]}','${
                parseInt(DC_No_data[0].DC_No) + 1
              }',now(),'${
                req.body.primary.amountReceived
              }','${paymentMode}','${billType}',
              '${paymentTerms}',
              '${req.body.primary.paymentDescription}','${
                req.body.primary.custNo
              }','${req.body.primary.consignee}','${
                req.body.primary.address
              }','${req.body.primary.district}','${req.body.primary.state}','${
                req.body.primary.pinCode
              }','${req.body.primary.delivery}','${req.body.primary.gst}','${
                req.body.primary.poNo
              }',now(),'${req.body.netTotal}','${req.body.discount}','${
                req.body.taxAmount
              }','${req.body.deliveryCharge}','${req.body.invoiceTotal}','${
                req.body.roundOff
              }','${req.body.grandTotal}','${PNStatus}','${
                dispatchDate + " 00:00:00"
              }','${req.body.primary.dispatchMode}','${
                req.body.primary.vehicleNo
              }','${req.body.primary.remarks}')
               `,
              (err, registerData) => {
                if (err) logger.error(err);
                // console.log("register done", registerData);

                // insert into detailssssss
                let flag = 0;

                for (let i = 0; i < req.body.tableRow.length; i++) {
                  const element = req.body.tableRow[i];

                  // console.log("elment", i + 1, element);
                  try {
                    misQueryMod(
                      `insert into magodmis.draft_dc_inv_details(DC_Inv_No,DC_Inv_Srl,Cust_Code,Dwg_No,Mtrl,Qty,Unit_Wt,DC_Srl_Wt,Unit_Rate,DC_Srl_Amt,Excise_CL_no,DespStatus)
                    values(${registerData?.insertId},${i + 1},${
                        req.body.primary.custNo
                      },'${element.desc}','${element.material}',${
                        element.quantity
                      },${element.unitWeight},${element.totalWeight},${
                        element.unitRate
                      },${element.totalAmount},'${
                        element.excise
                      }','${PNStatus}')`,
                      (err, detailsData) => {
                        if (err) logger.error(err);

                        // console.log("fully done");
                        // console.log("into details", detailsData);
                        // console.log("done.............");

                        // const dataCreateNew = getDataCreateNew(
                        //   registerData?.insertId
                        // );
                        // res.send(dataCreateNew);

                        // console.log("sent the data to frontend........");
                        // console.log("after all the process", dataCreateNew);
                        // console.log("data into post", dataCreateNew);

                        // console.log("completed the processs................");

                        // try {
                        //   misQueryMod(
                        //     ``,
                        //     (err, selectData) => {
                        //       if (err) logger.error(err);

                        //     // console.log("select done", selectData);
                        //     // console.log("done.............");

                        //     }
                        //   );
                        // } catch (error) {
                        //   next(error);
                        // }
                      }
                    );
                  } catch (error) {
                    next(error);
                  }
                }

                // console.log("selected taxes", req.body.SelectedTaxes);
                if (req.body.SelectedTaxes?.length > 0) {
                  for (let i = 0; i < req.body.SelectedTaxes.length; i++) {
                    const element = req.body.SelectedTaxes[i];

                    // console.log(
                    //   "element......",
                    //   element,
                    //   "dc inv no",
                    //   registerData?.insertId
                    // );

                    try {
                      misQueryMod(
                        `INSERT INTO magodmis.dc_inv_taxtable (Dc_inv_No,DcTaxID,TaxID, Tax_Name, TaxOn, TaxableAmount, TaxPercent, TaxAmt)
                        VALUES (${registerData?.insertId},${i + 1},${
                          element.taxID
                        }, '${element.taxName}', '${element.taxOn}', ${
                          element.taxableAmount
                        }, ${element.taxPercentage}, ${element.taxAmount})`,
                        (err, taxRes) => {
                          if (err) logger.error(err);
                          // console.log("done in tax", taxRes);
                        }
                      );
                    } catch (error) {
                      next(error);
                    }
                    // console.log("skjfhjsd.......", i);
                  }
                  flag = 1;
                } else {
                  flag = 1;
                }

                if (flag === 1) {
                  try {
                    misQueryMod(
                      `SELECT
                        *,
                        DATE_FORMAT(DC_Date, '%d/%m/%Y') AS DC_Date,
                        DATE_FORMAT(Inv_Date, '%d/%m/%Y') AS Inv_Date
                      FROM
                          magodmis.draft_dc_inv_register
                                INNER JOIN
                            magodmis.draft_dc_inv_details ON magodmis.draft_dc_inv_register.DC_Inv_No = magodmis.draft_dc_inv_details.DC_Inv_No
                        WHERE
                            magodmis.draft_dc_inv_register.DC_Inv_No = ${registerData?.insertId}`,
                      (err, selectData) => {
                        if (err) logger.error(err);
                        // console.log("select data", selectData);

                        try {
                          misQueryMod(
                            `SELECT * FROM magodmis.dc_inv_taxtable where Dc_inv_No = ${registerData?.insertId}`,
                            (err, taxData) => {
                              if (err) logger.error(err);
                              res.send({
                                selectData: selectData,
                                taxData: taxData,
                                message: "Packing Note Created Successfully",
                                flag: flag,
                              });
                            }
                          );
                        } catch (error) {
                          next(error);
                        }

                        // res.send({
                        //   selectData: selectData,
                        //   message: "Invoice Created Successfully",
                        // });
                        // console.log(".....................");
                        // console.log("detailsData", detailsData);
                        // res.send(selectData);
                        // console.log("select done", selectData);
                        // console.log("done.............");
                        // return selectData;
                      }
                    );
                  } catch (error) {
                    next(error);
                  }
                } else if (flag === 0) {
                  res.send({
                    // selectData: selectData,
                    // taxData: taxData,
                    message: "Error in Backend",
                    flag: flag,
                  });
                } else {
                  res.send({
                    message: "Uncaught Error, Check with backend",
                    flag: flag,
                  });
                }
              }
            );
          } catch (error) {
            next(error);
          }
        }
      );
    } catch (error) {
      next(error);
    }
    // /---------------------------------
    // try {
    //   for (let i = 0; i < req.body.selectedRows?.length; i++) {
    //     const element = req.body.selectedRows[i];

    //     // console.log("element,,,,,123", element);

    //     try {
    //       misQueryMod(
    //         `select * from magodmis.orderscheduledetails where scheduleId=${req.body.selectedRows[i]}`,
    //         (err, Data) => {
    //           if (err) logger.error(err);

    //           try {
    //             misQueryMod(
    //               `insert into magodmis.draft_dc_inv_details(DC_Inv_No,DC_Inv_Srl,Cust_Code,Dwg_No,Mtrl,Qty,Unit_Wt,DC_Srl_Wt,Unit_Rate,DC_Srl_Amt,Excise_CL_no,DespStatus)
    //                       values(
    //                         ${registerData?.insertId},${i + 1},
    //                         ${req.body.primary.custNo},'${element.desc}','${
    //                 element.material
    //               }',${element.quantity},${element.unitWeight},${
    //                 element.totalWeight
    //               },${element.unitRate},${element.totalAmount},'${
    //                 element.excise
    //               }','${PNStatus}')`,
    //               (err, detailsData) => {
    //                 if (err) logger.error(err);
    //               }
    //             );
    //           } catch (error) {
    //             next(error);
    //           }
    //         }
    //       );
    //     } catch (error) {}
    //   }
    // } catch (error) {}
  }
);

inspectionProfileRouter.post(
  `/updateinspectionform`,
  async (req, res, next) => {
    try {
      // console.log("req.body", req.body);

      misQueryMod(
        `UPDATE magodmis.draft_dc_inv_register 
        SET InspBy = ?, PackedBy = ? 
        WHERE DC_Inv_No = ?`,
        async (data) => {
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

inspectionProfileRouter.post("/resetInDraftParts", (req, res) => {
  DraftQtyOK = true;
  try {
    misQueryMod.apply(`
    SELECT
        detail.OrderSchDetailsID,
        SUM(detail.Qty) AS TotalPartsInDraft
    FROM
       magodmis.draft_dc_inv_details AS detail
    INNER JOIN
        magodmis.draft_dc_inv_register AS dc ON dc.DC_Inv_No = detail.DC_Inv_No
    WHERE
        dc.DCStatus = 'Draft'
    GROUP BY
        detail.OrderSchDetailsID`),
      (err, data) => {
        if (err) {
          res.send(err);
        } else {
          res.send(data);
          for (let i = 0; i < selectedRowData.length; i++) {
            const element = selectedRowData[i];
            selectedRowData[i].InDraftPN = 0;
          }
          // Updating PackNow property and checking for conditions
          for (let i = 0; i < orderscheduledetails.length; i++) {
            const schPart = orderscheduledetails[i];

            schPart.PackNow =
              schPart.QtyCleared - schPart.QtyPacked - schPart.InDraftPN;

            if (schPart.PackNow < 0) {
              DraftQtyOK = false;
            }
          }
        }
      };
  } catch (error) {}
});

inspectionProfileRouter.post("/raiseRejection", (req, res) => {
  console.log("entering into  RejectionData");
  // const currentYear = new Date().getFullYear();
  // const nextYear = currentYear + 1;
  // const financialYear = `${currentYear.toString().slice(-2)}/${nextYear
  //   .toString()
  //   .slice(-2)}`;
  //console.log("financialYear", financialYear);

  // try {
  //   misQueryMod(
  //     "SELECT * FROM magodmis.rejectionslist ORDER BY Id DESC LIMIT 1",
  //     (err, data) => {
  //       if (err) logger.error(err);
  //       // res.send(data);

  //       for (let i = 0; i < req.body.selectedScheduleDetailsRows.length; i++) {
  //         const element = req.body.selectedScheduleDetailsRows[i];
  //         if (req.body.selectedScheduleDetailsRows[i].length > 0) {
  //           try {
  //             // console.log("req.body", req.body);
  //             misQueryMod(
  //               `SELECT * FROM magodmis.rejectionslist r WHERE r.ScheduleId=${req.body.selectedScheduleDetailsRows[i].ScheduleId}`,
  //               async (data) => {
  //                 res.send(data);
  //                 console.log("Rej-data1.....", data);
  //                 try {
  //                   misQueryMod(
  //                     `SELECT i.* FROM magodmis.rejectionslist r, magodmis.internal_rejectionpartslist i WHERE r.ScheduleId=${req.body.selectedScheduleDetailsRows[i].ScheduleId} AND i.Rej_Id=r.Id `,
  //                     async (data) => {
  //                       res.send(data);
  //                       console.log("Rej-data2.....", data);
  //                     }
  //                   );
  //                 } catch (error) {
  //                   next(error);
  //                 }
  //               }
  //             );
  //           } catch (error) {
  //             next(error);
  //           }
  //         }
  //       }
  //     }
  //   );
  // } catch (error) {}
});

inspectionProfileRouter.post("/RejectionReport", async (req, res) => {
  //  console.log("entering into RejectionReport");

  try {
    misQueryMod(
      "select ir.* , r.* from magodmis.internal_rejectionpartslist AS ir INNER JOIN magodmis.rejectionslist AS r ON ir.Rej_Id = r.Id ORDER BY ir.Id DESC LIMIT 1",
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch {}
});

inspectionProfileRouter.post("/submitRejectionReport", async (req, res) => {
  console.log("entering into submitRejectionReport");
  // console.log("req", req.body);
  try {
    const today = new Date();
    const year = today.getUTCFullYear();
    const month = String(today.getUTCMonth() + 1).padStart(2, "0");
    const day = String(today.getUTCDate()).padStart(2, "0");
    let Rej_ReportDate = `${year}-${month}-${day}`;
    // console.log("Rej_ReportDate", typeof Rej_ReportDate);

    try {
      const formattedDate = new Date(Rej_ReportDate)
        .toISOString()
        .split("T")[0];

      const query = `
        INSERT INTO magodmis.rejectionslist(
          Rej_ReportNo, RaisedBy, Internal, Rej_ReportDate, RejctionValue, AcceptedValue, OrderScheduleNo, Cust_Code, Cust_Name, ScheduleId, Rej_Status
        ) VALUES (
          '${req.body.reportNo}',
          '${req.body.RaisedBy}',
          '1',
          '${formattedDate}',  
          ${parseFloat(
            req.body.rejectedValue
          )},  -- Parse as float for decimal values
          ${parseFloat(req.body.acceptedValue)},
          '${req.body.Rejection_Ref}',
          '${req.body.Cust_Code}',
          '${req.body.Cust_Name}',
          ${parseInt(
            req.body.ScheduleId,
            10
          )},  -- Parse as integer for ScheduleId
          '${req.body.Status}'
        )`;

      misQueryMod(query, (err, rejData) => {
        if (err) {
          console.error("Error:", err);
        } else {
          // console.log("Result:", rejData);
          const rejId = rejData.insertId;
          // console.log("1....................rejData.rejId", rejId);
          for (
            let i = 0;
            i < req.body.selectedScheduleDetailsRows.length;
            i++
          ) {
            const element = req.body.selectedScheduleDetailsRows[i];
            // console.log(rejId);
            // console.log(element.DwgName);
            console.log(req.body.QtyRejected[i]);
            // console.log(req.body.RejectedReason[i]);
            // console.log(element.SchDetailsID);

            const query1 = `
                INSERT INTO magodmis.internal_rejectionpartslist (
                  Rej_Id, Dwg_Name, Qty_Rejected, Rejection_Reason, SchDetailsID
                ) VALUES (
               ${parseInt(rejId)},
              '${element.DwgName}',
              ${parseInt(req.body.QtyRejected[i])},
              '${req.body.RejectedReason[i]}',
              ${parseInt(element.SchDetailsID)}

            )`;

            misQueryMod(query1, (err, intRejData) => {
              if (err) {
                console.error("Error:", err);
              } else {
                // console.log("2.......................Result:", intRejData);
                misQueryMod(
                  `UPDATE magodmis.orderscheduledetails SET QtyRejected = QtyRejected + ${parseInt(
                    req.body.QtyRejected[i]
                  )} WHERE SchDetailsID = ${parseInt(element.SchDetailsID)}`,
                  (uerr, updateQtyResult) => {
                    if (uerr) {
                      console.error("Error:", uerr);
                    } else {
                      // res.send(updateQtyResult);
                      // console.log(
                      //   "3.......................Update orderscheduledetails result:",
                      //   updateQtyResult
                      // );
                      // misQueryMod(
                      //   `SELECT * FROM magodmis.rejectionslist r WHERE r.ScheduleId=${req.body.ScheduleId} `,
                      //   (err, data) => {
                      //     if (err) {
                      //       logger.error(err);
                      //     } else {
                      //       console.log(
                      //         "magodmis.rejectionslist data....",
                      //         data
                      //       );
                      //       res.send(data);
                      //     }
                      //   }
                      // );
                    }
                  }
                );
              }
            });
          }
        }
      });
    } catch (error) {
      next(error);
    }
  } catch (error) {
    console.error("Error in submitRejectionReport:", error);
    res.status(500).send("Internal Server Error");
  }
});

inspectionProfileRouter.post("/deleteDraftPN", (req, res) => {
  // const DC_Inv_No = req.body.DC_Inv_No;

  // console.log("reqqqqqqqqqqqqq", req.body.DC_Inv_No);

  try {
    misQueryMod(
      `DELETE FROM magodmis.draft_dc_inv_register WHERE (DC_Inv_No = '${req.body.DC_Inv_No}')`,
      (err, deleteData) => {
        if (err) {
          console.log("errrr", err);
        } else {
          res.send({
            flag: 1,
            message: "Delete draft PN successful",
          });
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

inspectionProfileRouter.post("/postCreateDraftPN", async (req, res, next) => {
  // console.log("reqqqq", req.body);

  // console.log(
  //   "req.body.headerData[0].ScheduleDate",
  //   req.body.headerData[0].ScheduleDate
  // );

  const DCStatus = "Draft";
  try {
    misQueryMod(
      `INSERT INTO magodmis.draft_dc_inv_register
        (ScheduleId, DC_InvType, InvoiceFor, OrderNo, OrderScheduleNo, OrderDate, Cust_Code, Cust_Name, Cust_Address, Cust_Place, Cust_State, Cust_StateId, PIN_Code, Del_Address, GSTNo, PO_No, Total_Wt, DCStatus)
        VALUES
        ('${req.body.headerData[0].ScheduleId}', '${
        req.body.headerData[0].ScheduleType
      }', '${req.body.headerData[0].Type}', '${
        req.body.headerData[0].Order_No
      }', '${req.body.headerData[0].OrdSchNo}', '${
        req.body.headerData[0].OriginalScheduleDate.split("T")[0]
      }', '${req.body.headerData[0].Cust_Code}', '${
        req.body.headerData[0].Cust_name
      }', '${req.body.headerData[0].Address}', '${
        req.body.headerData[0].City
      }', '${req.body.headerData[0].State}', '${
        req.body.headerData[0].StateId
      }', '${req.body.headerData[0].Pin_Code}', '${
        req.body.headerData[0].Delivery ? req.body.headerData[0].Delivery : ""
      }', '${req.body.headerData[0].GSTNo}', '${
        req.body.headerData[0].PO
      }', '0', '${DCStatus}')`,
      (err, registerData) => {
        if (err) {
          console.log("errrr", err);
        } else {
          // console.log("registerdata", registerData);
          // res.send(registerData);

          // fetching material data for excise
          try {
            misQueryMod(
              `SELECT 
                  *
                FROM
                  magodmis.mtrl_typeslist
                `,

              (err, materialData) => {
                if (err) {
                  console.log("errr", err);
                } else {
                  // console.log("materialData", materialData);
                  // insert into detailssssss

                  // res.send(materialData);
                  let flag = [];
                  for (
                    let i = 0;
                    i < req.body.rowsForCreateDraftPN.length;
                    i++
                  ) {
                    const element = req.body.rowsForCreateDraftPN[i];

                    let excise = "";

                    excise = materialData.filter(
                      (obj) => obj.Material === element.Material
                    )[0]?.ExciseClNo;
                    // console.log("excise", excise);

                    let qtyForDraft =
                      parseInt(element.QtyCleared) -
                      parseInt(element.QtyPacked) -
                      parseInt(element.InDraftPN);

                    // console.log("qtyForDraft", qtyForDraft);
                    // ? materialData.filter(
                    //     (obj) =>
                    //       obj.Material === element.Material ||
                    //       obj.MtrlID === element.Mtrl
                    //   )?.ExciseClNo
                    // : "";
                    // console.log("excise", excise);
                    try {
                      misQueryMod(
                        `INSERT INTO magodmis.draft_dc_inv_details
                          (DC_Inv_No, DC_Inv_Srl, ScheduleID, OrderSchDetailsID, Cust_Code, Order_No, Order_Srl_No, OrderScheduleNo,Dwg_Code, Dwg_No, Mtrl, Material, Qty, Unit_Wt, DC_Srl_Wt, Unit_Rate, DC_Srl_Amt, Excise_CL_no, DespStatus, PkngLevel, InspLevel, Mtrl_rate, JW_Rate)
                          VALUES
                          (
                       ${registerData.insertId}, ${i + 1},  ${
                          element.ScheduleId
                        }, ${element.SchDetailsID}, '${
                          req.body.headerData[0].Cust_Code
                        }', '${req.body.headerData[0].Order_No}', '${
                          element.Schedule_Srl
                        }', '${req.body.headerData[0].OrdSchNo}','${
                          element.Dwg_Code
                        }', '${element.DwgName}', '${element.Mtrl_Code}', '${
                          element.Material ? element.Material : ""
                        }', '${qtyForDraft}', ${element.UnitWt}, ${(
                          parseFloat(qtyForDraft) * parseFloat(element.UnitWt)
                        ).toFixed(2)}, ${element.UnitPrice}, ${(
                          parseFloat(qtyForDraft) *
                          parseFloat(element.UnitPrice)
                        ).toFixed(2)}, '${excise}', '${DCStatus}', '${
                          element.PackingLevel
                        }', '${element.InspLevel}',
                           ${parseFloat(element.MtrlCost).toFixed(
                             2
                           )},${parseFloat(element.JWCost).toFixed(2)})`,

                        (err, detailsData) => {
                          if (err) {
                            console.log("errr", err);
                          } else {
                            flag.push(1);
                            // console.log("detailsData", detailsData);
                            // console.log("dateeee", new Date());
                          }
                        }
                      );
                    } catch (error) {
                      next(error);
                    }
                  }
                  if (flag.length > 0) {
                    res.send({ flag: 0, message: "Some backend error occur" });
                  } else {
                    res.send({
                      flag: 1,
                      message: "Create draft PN successfull",
                    });
                  }
                  // console.log("doneeee");
                  // res.send("doneee");
                }
              }
            );
          } catch (error) {
            next(error);
          }
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

inspectionProfileRouter.post("/saveDraftPN", async (req, res, next) => {
  // console.log("reqqqq", req.body);

  // console.log(
  //   "req.body.headerData[0].ScheduleDate",
  //   req.body.headerData[0].ScheduleDate
  // );

  // const DCStatus = "Draft";

  // let flag = [];
  for (let i = 0; i < req.body.invDetailsData.length; i++) {
    const element = req.body.invDetailsData[i];

    try {
      misQueryMod(
        `UPDATE magodmis.draft_dc_inv_details 
        SET 
            Qty = '${element.Qty}',
            Unit_Wt = '${element.Unit_Wt}'
        WHERE
            (Draft_dc_inv_DetailsID = '${element.Draft_dc_inv_DetailsID}')
                AND (DC_Inv_No = '${element.DC_Inv_No}')
                AND (DC_Inv_Srl = '${element.DC_Inv_Srl}')`,
        (err, updateDetails) => {
          if (err) {
            console.log("errrr", err);
          } else {
            // flag.push(1);
            // console.log("updateDetails", updateDetails);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }

  // console.log("flag...", flag);

  res.send({
    flag: 1,
    message: "Update draft PN successful",
  });
});

inspectionProfileRouter.post("/preparePN", async (req, res, next) => {
  const DCStatus = "Packed";
  const today = new Date();

  var todayDate = today.toISOString().split("T")[0];

  // console.log("bodyy.....", req.body);

  // get old dcno ....
  try {
    misQueryMod(
      `SELECT 
            DC_No
        FROM
            magodmis.draft_dc_inv_register
        WHERE
            DC_No IS NOT NULL AND DC_No != 'null'
                AND DC_No != ''
                AND DC_No != 'NaN'
                AND DC_No != 'undefined'
                AND DC_InvType != 'ReturnableDC'
        ORDER BY DC_Inv_No DESC`,
      (err, old_DC_No) => {
        if (err) {
          console.log("errrr", err);
        } else {
          // console.log("old_DC_No", old_DC_No);

          // update register
          try {
            misQueryMod(
              `UPDATE magodmis.draft_dc_inv_register
                SET
                    DC_No = '${parseInt(old_DC_No[0].DC_No) + 1}',
                    DC_Date = '${todayDate}',
                    DCStatus = '${DCStatus}',
                    InspBy = '${req.body.insAndPack.inspectedBy}',
                    PackedBy = '${req.body.insAndPack.packedBy}'
                WHERE
                    (DC_Inv_No = '${req.body.DC_Inv_No}')`,
              (err, updateRegister) => {
                if (err) {
                  console.log("errrr", err);
                } else {
                  // update details
                  try {
                    misQueryMod(
                      `UPDATE magodmis.draft_dc_inv_details
                      SET
                          DespStatus = '${DCStatus}'
                      WHERE
                          (DC_Inv_No = '${req.body.DC_Inv_No}')`,
                      (err, updateDetails) => {
                        if (err) {
                          console.log("errrr", err);
                        } else {
                          // console.log("updateDetails", updateDetails);

                          // let flag = [];

                          // updating orderschedule details
                          for (
                            let i = 0;
                            i < req.body.invDetailsData?.length;
                            i++
                          ) {
                            const element = req.body.invDetailsData[i];

                            try {
                              misQueryMod(
                                `UPDATE magodmis.orderscheduledetails
                                  SET
                                      QtyPacked = '${element.Qty}'
                                  WHERE
                                      (SchDetailsID = '${element.OrderSchDetailsID}')`,
                                (err, updateOrderDetails) => {
                                  if (err) {
                                    console.log("errrr", err);
                                  } else {
                                    // console.log(
                                    //   "done in order schedule details"
                                    // );
                                    // flag.push(1);
                                  }
                                }
                              );
                            } catch (error) {
                              next(error);
                            }
                          }

                          // console.log("flag", flag);

                          res.send({
                            flag: 1,
                            message: "Prepare PN successful",
                          });
                        }
                      }
                    );
                  } catch (error) {
                    next(error);
                  }

                  // console.log("updateRegister", updateRegister);
                }
              }
            );
          } catch (error) {
            next(error);
          }
        }
      }
    );
  } catch (error) {
    next(error);
  }

  // for (let i = 0; i < req.body.invDetailsData.length; i++) {
  //   const element = req.body.invDetailsData[i];

  //   try {
  //     misQueryMod(
  //       `UPDATE magodmis.draft_dc_inv_details
  //       SET
  //           Qty = '${element.Qty}',
  //           Unit_Wt = '${element.Unit_Wt}'
  //       WHERE
  //           (Draft_dc_inv_DetailsID = '${element.Draft_dc_inv_DetailsID}')
  //               AND (DC_Inv_No = '${element.DC_Inv_No}')
  //               AND (DC_Inv_Srl = '${element.DC_Inv_Srl}')`,
  //       (err, updateDetails) => {
  //         if (err) {
  //           console.log("errrr", err);
  //         } else {
  //           // flag.push(1);
  //           // console.log("updateDetails", updateDetails);
  //         }
  //       }
  //     );
  //   } catch (error) {
  //     next(error);
  //   }
  // }
});

inspectionProfileRouter.post(
  "/getOrderScheduleData",
  async (req, res, next) => {
    // console.log("reqqqq", req.body);
    try {
      misQueryMod(
        `SELECT
          *,
          ScheduleDate AS OriginalScheduleDate,
          DATE_FORMAT(schTgtDate, '%d/%m/%Y') AS schTgtDate,
          DATE_FORMAT(ScheduleDate, '%d/%m/%Y') AS ScheduleDate,
          DATE_FORMAT(Delivery_Date, '%d/%m/%Y') AS Delivery_Date
      FROM
          magodmis.orderschedule
              INNER JOIN
          magodmis.cust_data ON magodmis.orderschedule.Cust_Code = magodmis.cust_data.Cust_Code
      WHERE
          magodmis.orderschedule.ScheduleId = ${req.body.scheduleID}`,
        (err, headerData) => {
          if (err) {
            logger.error(err);
          } else {
            let InDraftPN = 0;
            // orderscheduledetails
            try {
              misQueryMod(
                `SELECT * FROM magodmis.orderscheduledetails where magodmis.orderscheduledetails.ScheduleId = ${req.body.scheduleID}`,
                (err, orderScheduleDetailsData) => {
                  if (err) {
                    logger.error(err);
                  } else {
                    // console.log(
                    //   "orderScheduleDetailsData",
                    //   orderScheduleDetailsData
                    // );

                    try {
                      misQueryMod(
                        `SET @@sql_mode = REPLACE(@@sql_mode, 'ONLY_FULL_GROUP_BY', '')`,
                        (err, updateGroupBy) => {
                          if (err) {
                            logger.error(err);
                          } else {
                            try {
                              misQueryMod(
                                `
                                SELECT
                                    *, SUM(qty) AS Qty
                                FROM
                                    magodmis.draft_dc_inv_details
                                WHERE
                                    ScheduleId = ${req.body.scheduleID}
                                        AND DespStatus != 'Cancelled'
                                GROUP BY OrderSchDetailsID , DespStatus`,
                                (err, draftDCInvDetailsData) => {
                                  if (err) {
                                    logger.error(err);
                                  } else {
                                    // adding the in draft pn column to every element of orderScheduleDetailsData
                                    for (
                                      let i = 0;
                                      i < orderScheduleDetailsData.length;
                                      i++
                                    ) {
                                      // const element = orderScheduleDetailsData[i];
                                      orderScheduleDetailsData[i].InDraftPN = 0;
                                    }

                                    // console.log(
                                    //   "orderScheduleDetailsData",
                                    //   orderScheduleDetailsData
                                    // );

                                    for (
                                      let i = 0;
                                      i < orderScheduleDetailsData.length;
                                      i++
                                    ) {
                                      const element0 =
                                        orderScheduleDetailsData[i];

                                      for (
                                        let j = 0;
                                        j < draftDCInvDetailsData.length;
                                        j++
                                      ) {
                                        const element1 =
                                          draftDCInvDetailsData[j];
                                        if (
                                          element0.SchDetailsID ===
                                            element1.OrderSchDetailsID &&
                                          element1.DespStatus === "Draft"
                                        ) {
                                          orderScheduleDetailsData[
                                            i
                                          ].InDraftPN = element1.Qty;

                                          // console.log(
                                          //   "need to add in draft pn",
                                          //   element0
                                          // );
                                        } else {
                                          // console.log("no need to add");
                                        }
                                      }
                                    }

                                    // select inv register
                                    try {
                                      misQueryMod(
                                        `SELECT  *,
                                          DATE_ADD(DespatchDate, INTERVAL 1 DAY) AS DespatchDate,
                                          DATE_FORMAT(DC_Date, '%d/%m/%Y') AS Printable_DC_Date,
                                          DATE_FORMAT(PO_Date, '%d/%m/%Y') AS Printable_PO_Date,
                                          DATE_FORMAT(Inv_Date, '%d/%m/%Y') AS Printable_Inv_Date,
                                          DATE_FORMAT(DespatchDate, '%d/%m/%Y') AS Printable_DespatchDate
                                        FROM
                                          magodmis.draft_dc_inv_register WHERE ScheduleId = ${req.body.scheduleID}`,
                                        (err, invRegisterData) => {
                                          if (err) {
                                            logger.error(err);
                                          } else {
                                            // set inv details
                                            try {
                                              misQueryMod(
                                                `SELECT * FROM magodmis.draft_dc_inv_details WHERE ScheduleId = ${req.body.scheduleID}`,
                                                (err, invDetailsData) => {
                                                  if (err) {
                                                    logger.error(err);
                                                  } else {
                                                    res.send({
                                                      headerData: headerData,
                                                      orderScheduleDetailsData:
                                                        orderScheduleDetailsData,
                                                      allInvDetailsData:
                                                        invDetailsData,
                                                      invRegisterData:
                                                        invRegisterData,
                                                    });
                                                  }
                                                }
                                              );
                                            } catch (error) {
                                              next(error);
                                            }
                                          }
                                        }
                                      );
                                    } catch (error) {
                                      next(error);
                                    }

                                    // res.send({
                                    //   headerData: headerData,
                                    //   orderScheduleDetailsData:
                                    //     orderScheduleDetailsData,
                                    // });
                                  }
                                }
                              );
                            } catch (error) {
                              next(error);
                            }
                          }
                        }
                      );
                    } catch (error) {
                      next(error);
                    }

                    // res.send({ headerData: headerData });
                    // console.log("headerData", headerData);
                  }
                }
              );
            } catch (error) {
              next(error);
            }

            // res.send({ headerData: headerData });
            // console.log("headerData", headerData);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);
inspectionProfileRouter.post("/testRejectData", async (req, res, next) => {
  console.log("reqqqq testRejectData.....1", req.body.scId);
  try {
    misQueryMod(
      // `SELECT * FROM magodmis.rejectionslist r WHERE r.ScheduleId='124826' `,
      `SELECT * FROM magodmis.rejectionslist r WHERE r.ScheduleId=${req.body.scId} `,
      (err, data) => {
        if (err) logger.error(err);

        console.log("data....1", data);
        res.send(data);
      }
    );
  } catch (error) {}
});

inspectionProfileRouter.post(
  "/testInternalRejectData",
  async (req, res, next) => {
    // console.log("reqqqq....2", req.body);

    try {
      misQueryMod(
        `
          SELECT i.* FROM  magodmis.internal_rejectionpartslist i
          WHERE  i.Rej_Id=${req.body.row.Id}`,
        async (error, data) => {
          if (error) {
            console.error("Error executing query:", error);
          } else {
            // console.log("data...2", data);
            res.send(data);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

inspectionProfileRouter.post(
  "/getOrderDataforFindSchedule",
  async (req, res) => {
    try {
      misQueryMod(
        `SELECT o.*
        FROM magodmis.orderschedule o
        WHERE NOT (
            o.Schedule_Status LIKE 'Created'
            OR o.Schedule_Status LIKE 'Dispatched'
            OR o.Schedule_Status LIKE 'Closed'
            OR o.Schedule_Status LIKE 'Cancelled'
            OR o.Schedule_Status LIKE 'Ready'
            OR o.Schedule_Status LIKE 'Suspended'
            OR o.Schedule_Status LIKE 'Comb%'
        )
        AND o.ScheduleType NOT LIKE 'Combined'
        
        ORDER BY o.ScheduleDate DESC `,
        (err, data) => {
          if (err) logger.error(err);

          console.log("data....1", data);
          res.send(data);
        }
      );
    } catch (error) {}
  }
);
module.exports = inspectionProfileRouter;

// for (let i = 0; i < req.body.selectRejRow[i].length; i++) {
//   const element = req.body.selectRejRow[i];
//   if (req.body.selectRejRow[i].length > 0) {
//     try {
//       // console.log("req.body", req.body);
//       misQueryMod(
//         `SELECT * FROM magodmis.rejectionslist r WHERE r.ScheduleId=${req.body.selectRejRow[i].ScheduleId}`,
//         async (data) => {
//           // res.send(data);
//           console.log("Rej-data1.....", data);
//           try {
//             misQueryMod(
//               `SELECT i.* FROM magodmis.rejectionslist r, magodmis.internal_rejectionpartslist i WHERE r.ScheduleId=${req.body.selectRejRow[i].ScheduleId} AND i.Rej_Id=${req.body.selectRejRow[i].Id} `,
//               async (data) => {
//                 res.send(data);
//                 console.log("Rej-data2.....", data);
//               }
//             );
//           } catch (error) {
//             next(error);
//           }
//         }
//       );
//     } catch (error) {
//       next(error);
//     }
//   }
// }