const pnProfileRouter = require("express").Router();
const { misQuery, setupQuery, misQueryMod } = require("../../helpers/dbconn");
const { logger } = require("../../helpers/logger");

pnProfileRouter.post("/pnprofileinvoices", async (req, res, next) => {
  try {
    if (!req.body.custCode) {
      misQueryMod(
        `SELECT
          *,DATE_FORMAT(Dc_inv_Date, "%d %M %Y") as Dc_inv_Date,
          DATE_FORMAT(DC_Date, "%d %M %Y") as DC_Date
        FROM
          magodmis.draft_dc_inv_register
        WHERE
          InvoiceFor = '${req.body.PNType}'
          AND DCStatus = '${req.body.Status}'
        ORDER BY DC_Inv_No DESC`,
        (err, data) => {
          if (err) logger.error(err);
          res.send(data);
        }
      );
    } else {
      misQueryMod(
        `SELECT
          *
        FROM
          magodmis.draft_dc_inv_register
        WHERE
          InvoiceFor = '${req.body.PNType}'
          AND DCStatus = '${req.body.Status}'
          AND Cust_code = '${req.body.custcode}'`,
        (err, data) => {
          if (err) logger.error(err);
          res.send(data);
        }
      );
    }
  } catch (error) {
    next(error);
  }
});

pnProfileRouter.post("/aboutInvoicePN", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT 
          *,
          DATE_ADD(DespatchDate, INTERVAL 1 DAY) AS DespatchDate,
          DATE_FORMAT(DC_Date, '%d/%m/%Y') AS Printable_DC_Date,
          DATE_FORMAT(PO_Date, '%d/%m/%Y') AS Printable_PO_Date,
          DATE_FORMAT(Inv_Date, '%d/%m/%Y') AS Printable_Inv_Date,
          DATE_FORMAT(DespatchDate, '%d/%m/%Y') AS Printable_DespatchDate,
          magodmis.orderschedule.ScheduleId,
          magodmis.orderschedule.Special_Instructions
      FROM
          magodmis.draft_dc_inv_register
              INNER JOIN
          magodmis.orderschedule ON magodmis.draft_dc_inv_register.ScheduleId = magodmis.orderschedule.ScheduleId
      WHERE
          DC_Inv_No = ${req.body.DCInvNo}`,
      (err, registerData) => {
        if (err) logger.error(err);

        try {
          misQueryMod(
            `SELECT
              *
            FROM
              magodmis.draft_dc_inv_details
            WHERE
              DC_Inv_No = ${req.body.DCInvNo}`,
            (err, detailsData) => {
              if (err) logger.error(err);
              try {
                misQueryMod(
                  `SELECT
                    *
                  FROM
                    magodmis.dc_inv_taxtable
                  WHERE
                    DC_Inv_No = ${req.body.DCInvNo}`,
                  (err, taxData) => {
                    if (err) logger.error(err);
                    res.send({
                      registerData: registerData,
                      taxData: taxData,
                      detailsData: detailsData,
                      flag: 1,
                    });
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
  } catch (error) {
    next(error);
  }
});

pnProfileRouter.post("/getTaxData", async (req, res, next) => {
  // get the cust details
  try {
    misQueryMod(
      `SELECT * FROM magodmis.cust_data where Cust_Code =${req.body.Cust_Code}`,
      (err, custData) => {
        if (err) {
          logger.error(err);
        } else {
          let query = "";
          if (custData[0].IsGovtOrg) {
            query = `SELECT 
                          *
                      FROM
                          magod_setup.taxdb
                      WHERE
                          EffectiveTO >= NOW() AND TaxID IS NULL`;
          } else if (custData[0].IsForiegn) {
            query = `SELECT 
                          *
                      FROM
                          magod_setup.taxdb
                      WHERE
                          EffectiveTO >= NOW() AND IGST != 0 
                      ORDER BY TaxName DESC
                          `;
          } else if (
            custData[0].GSTNo === null ||
            custData[0].GSTNo === undefined ||
            custData[0].GSTNo === "null" ||
            custData[0].GSTNo === "" ||
            custData[0].GSTNo.length === 0
          ) {
            query = `SELECT 
                          *
                      FROM
                          magod_setup.taxdb
                      WHERE
                          EffectiveTO >= NOW() AND IGST = 0
                              AND UnderGroup != 'INCOMETAX'`;
          } else if (
            parseInt(req.body.unitStateID) != parseInt(custData[0].StateId)
          ) {
            query = `SELECT 
                          *
                      FROM
                          magod_setup.taxdb
                      WHERE
                          EffectiveTO >= NOW() AND IGST != 0
                              AND UnderGroup != 'INCOMETAX'`;
          } else if (req.body.unitGST === custData[0].GSTNo) {
            // console.log("unitGST");
            query = `SELECT 
                          *
                      FROM
                          magod_setup.taxdb
                      WHERE
                          EffectiveTO >= NOW() AND TaxID IS NULL`;
          } else {
            query = `SELECT 
                          *
                      FROM
                          magod_setup.taxdb
                      WHERE
                          EffectiveTO >= NOW() AND IGST = 0
                              AND UnderGroup != 'INCOMETAX'`;
          }

          try {
            misQueryMod(query, (err, data) => {
              if (err) logger.error(err);
              res.send(data);
            });
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

pnProfileRouter.post("/getSetRateConsumerData", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT
            magodmis.draft_dc_inv_register.Cust_Name,
            magodmis.orderschedule.SalesContact,
            magodmis.draft_dc_inv_register.ScheduleId,
            magodmis.draft_dc_inv_register.DC_InvType AS ScheduleType,
            magodmis.draft_dc_inv_register.PO_No,
            magodmis.orderschedule.Schedule_Status,
            magodmis.orderschedule.TgtDelDate
        FROM
            magodmis.draft_dc_inv_register
              INNER JOIN
            magodmis.orderschedule ON magodmis.draft_dc_inv_register.ScheduleId = magodmis.orderschedule.ScheduleId
        WHERE
            magodmis.draft_dc_inv_register.ScheduleId = '${req.body.scheduleId}'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnProfileRouter.post("/updateRatesPN", async (req, res, next) => {
  for (let i = 0; i < req.body.newRates.length; i++) {
    const element = req.body.newRates[i];
    try {
      misQueryMod(
        `UPDATE magodmis.draft_dc_inv_details
            SET
                JW_Rate = ${element.JW_Rate},
                Mtrl_rate = ${element.Mtrl_rate},
                Unit_Rate = ${element.Unit_Rate},
                DC_Srl_Amt = ${
                  parseInt(element.Qty) *
                  parseFloat(element.Unit_Rate).toFixed(2)
                }

            WHERE
                Draft_dc_inv_DetailsID = ${element.Draft_dc_inv_DetailsID}`,
        (err, response) => {
          if (err) logger.error(err);
        }
      );
    } catch (error) {
      next(error);
    }
  }
  res.send("Set Rate Successful");
});

pnProfileRouter.post("/updatePNProfileData", async (req, res, next) => {
  const today = new Date();
  var todayDate = today.toISOString().split("T")[0];
  var dispatchDate = todayDate;
  if (req.body.invRegisterData.DespatchDate?.length > 0) {
    dispatchDate = req.body.invRegisterData?.DespatchDate?.split("T")[0];
  }

  try {
    misQueryMod(
      `UPDATE magodmis.draft_dc_inv_register
        SET
          PymtAmtRecd = '${req.body.invRegisterData.PymtAmtRecd || ""}',
          PaymentMode =  '${req.body.invRegisterData.PaymentMode || ""}',
          PaymentReceiptDetails =  '${
            req.body.invRegisterData.PaymentReceiptDetails || ""
          }',
          PO_No = '${req.body.invRegisterData.PO_No || ""}',
          Cust_Address = '${req.body.invRegisterData.Cust_Address || ""}',
          Del_Address = '${req.body.invRegisterData.Del_Address || ""}',
          Cust_Place = '${req.body.invRegisterData.Cust_Place || ""}',
          Cust_State = '${req.body.invRegisterData.Cust_State || ""}',
          PIN_Code = '${req.body.invRegisterData.PIN_Code || ""}',
          DespatchDate = '${dispatchDate}',
          TptMode = '${req.body.invRegisterData.TptMode || ""}',
          VehNo = '${req.body.invRegisterData.VehNo || ""}',
          Del_ContactName = '${req.body.invRegisterData.Del_ContactName || ""}',
          Del_ContactNo = '${req.body.invRegisterData.Del_ContactNo || ""}',
          Net_Total = '${parseFloat(req.body.invRegisterData.Net_Total).toFixed(
            2
          )}',
          TaxAmount = '${parseFloat(req.body.invRegisterData.TaxAmount).toFixed(
            2
          )}',
          Discount = '${parseFloat(req.body.invRegisterData.Discount).toFixed(
            2
          )}',
          Del_Chg = '${parseFloat(req.body.invRegisterData.Del_Chg).toFixed(
            2
          )}',
          Round_Off = '${parseFloat(req.body.invRegisterData.Round_Off).toFixed(
            2
          )}',
          GrandTotal = '${parseFloat(
            req.body.invRegisterData.GrandTotal
          ).toFixed(2)}',
          InvTotal = '${parseFloat(req.body.invRegisterData.InvTotal).toFixed(
            2
          )}',
          Remarks = '${req.body.invRegisterData.Remarks || ""}'
        WHERE
          (DC_Inv_No = ${req.body.invRegisterData.DC_Inv_No})`,
      (err, resp) => {
        if (err) {
          console.log("error in updatePNProfileData", err);
          if (err) logger.error(err);
          res.send({
            status: 0,
            comment: "Some unexpected error came in backend.",
          });
        } else {
          // update orderschedule ...
          try {
            misQueryMod(
              `UPDATE magodmis.orderschedule SET Special_Instructions = '${req.body.invRegisterData.Special_Instructions}' WHERE (ScheduleId = ${req.body.invRegisterData.ScheduleId})`,
              (err, delTax) => {
                if (err) logger.error(err);
              }
            );
          } catch (error) {
            next(error);
          }
          try {
            misQueryMod(
              `DELETE FROM magodmis.dc_inv_taxtable WHERE (Dc_inv_No = ${req.body.invRegisterData.DC_Inv_No})`,
              (err, delTax) => {
                if (err) logger.error(err);
              }
            );
          } catch (error) {
            next(error);
          }
          if (req.body.invTaxData?.length > 0) {
            // deleting the existing tax details
            for (let i = 0; i < req?.body?.invTaxData?.length; i++) {
              const element = req?.body?.invTaxData[i];
              // inserting the tax details
              try {
                misQueryMod(
                  `INSERT INTO magodmis.dc_inv_taxtable (Dc_inv_No, DcTaxID, TaxID, Tax_Name, TaxOn, TaxableAmount, TaxPercent, TaxAmt)
                      VALUES (${req.body.invRegisterData.DC_Inv_No}, ${
                    i + 1
                  }, ${element.TaxID}, '${element.Tax_Name}', '${
                    element.TaxOn
                  }', ${parseFloat(element.TaxableAmount).toFixed(
                    2
                  )}, ${parseFloat(element.TaxPercent).toFixed(
                    2
                  )}, ${parseFloat(element.TaxAmt).toFixed(2)})`,
                  (err, insTax) => {
                    if (err) logger.error(err);
                  }
                );
              } catch (error) {
                next(error);
              }
            }
            res.send({
              status: 1,
              comment: "Successfully saved the invoice.",
            });
          } else {
            res.send({
              status: 1,
              comment: "Successfully saved the invoice.",
            });
          }
        }
      }
    );
  } catch (error) {
    console.log("error in updatePNProfileData", error);
    res.send({
      status: 0,
      comment: "Some unexpected error came in server side.",
    });
  }
});

pnProfileRouter.post("/getPrintData", async (req, res, next) => {
  var DCInvNo = req.body.DCInvNo;
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
                INNER JOIN
            magodmis.combined_schedule_part_details ON magodmis.draft_dc_inv_register.ScheduleId = magodmis.combined_schedule_part_details.ScheduleID
        WHERE
            magodmis.draft_dc_inv_register.DC_Inv_No = ${DCInvNo}`,
      (err, data) => {
        if (err) logger.error(err);
        if (data.length > 0) {
          res.send(data);
        } else {
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
                    magodmis.draft_dc_inv_register.DC_Inv_No = ${DCInvNo}`,
              (err, data) => {
                if (err) logger.error(err);
                res.send(data);
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

pnProfileRouter.post("/cancelPN", async (req, res, next) => {
  try {
    misQueryMod(
      `UPDATE magodmis.draft_dc_inv_register SET DCStatus = 'Cancelled' WHERE (DC_Inv_No = '${req.body.invRegisterData.DC_Inv_No}')`,
      (err, cancelPNRegister) => {
        if (err) {
          logger.error(err);
        } else {
          try {
            misQueryMod(
              `UPDATE magodmis.draft_dc_inv_details SET DespStatus = 'NotSent' WHERE (DC_Inv_No = '${req.body.invRegisterData.DC_Inv_No}')`,
              (err, cancelPNDetails) => {
                if (err) {
                  logger.error(err);
                } else {
                  // updating the material issue register
                  try {
                    misQueryMod(
                      `UPDATE magodmis.material_issue_register SET IVStatus = 'Cancelled' WHERE (Dc_ID = '${req.body.invRegisterData.DC_Inv_No}')`,
                      (err, cancelIssueRegister) => {
                        if (err) {
                          logger.error(err);
                        } else {
                          res.send({
                            flag: 1,
                            message: "Packing Note Cancelled",
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
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = pnProfileRouter;
