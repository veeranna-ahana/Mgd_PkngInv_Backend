const InvoiceRouter = require("express").Router();
const {
  misQuery,
  setupQuery,
  setupQueryMod,
  misQueryMod,
} = require("../../helpers/dbconn");
const { logger } = require("../../helpers/logger");

InvoiceRouter.post("/getAllCust", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT * FROM magodmis.cust_data order by Cust_name`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});
InvoiceRouter.post("/getCustAccnToListData", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT 
            magodmis.cust_data.*
        FROM
            magodmis.draft_dc_inv_register
                INNER JOIN
            magodmis.cust_data ON magodmis.draft_dc_inv_register.Cust_Code = magodmis.cust_data.Cust_Code
        WHERE
            InvoiceFor = '${req.body.PNList}'
                AND DCStatus = '${req.body.Status}'
        GROUP BY magodmis.cust_data.Cust_Code
        ORDER BY magodmis.cust_data.Cust_name`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

InvoiceRouter.get("/allMaterials", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT * FROM magodmis.mtrl_typeslist ORDER BY Material`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

InvoiceRouter.get("/getAllStates", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT * FROM magod_setup.state_codelist ORDER BY State`,
      (err, states) => {
        res.send(states);
      }
    );
  } catch (error) {
    next(error);
  }
});

InvoiceRouter.post("/createPN", async (req, res, next) => {
  console.log("resiter", req.body.invRegisterData);
  const today = new Date();
  var BillType = "Cash";
  var todayDate = today.toISOString().split("T")[0];
  var dispatchDate = todayDate;
  if (req.body.invRegisterData.DespatchDate.length > 0) {
    dispatchDate = req.body.invRegisterData?.DespatchDate;
  }
  if (req.body.invRegisterData.BillType?.length > 0) {
    BillType = req.body.invRegisterData.BillType;
  }
  const DCStatus = "Packed";

  const { VoucherNoLength, unit, srlType, prefix } = req.body;

  const date = new Date();

  const year = date.getFullYear();

  const getYear =
    date.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  const yearParts = getYear.split("-");
  const startYearShort = yearParts[0].slice(-2);
  const endYearShort = yearParts[1].slice(-2);
  const finYear = `${startYearShort}/${endYearShort}`;

  console.log("finYear", finYear);

  try {
    const selectQuery = `
    SELECT * FROM magod_setup.magod_runningno WHERE SrlType='${srlType}' AND UnitName='${unit}' ORDER BY Id DESC LIMIT 1;
    `;

    setupQueryMod(selectQuery, async (selectError, selectResult) => {
      if (selectError) {
        logger.error(selectError);
        return next(selectResult);
      }

      let newDCNo = "";

      if (selectResult && selectResult.length > 0) {
        const lastRunNo = selectResult[0].Running_No;
        const numericPart = parseInt(lastRunNo) + 1;

        const paddedNumericPart = numericPart
          .toString()
          .padStart(VoucherNoLength, "0");

        newDCNo = `${paddedNumericPart}`;
        console.log("New DCNo:", newDCNo);

        // Update Running_No in magod_setup.magod_runningno
        const updateRunningNoQuery = `
          UPDATE magod_setup.magod_runningno
          SET Running_No = ${numericPart}
          WHERE SrlType='${srlType}' AND UnitName='${unit}' AND Period='${finYear}';
        `;

        setupQueryMod(updateRunningNoQuery, (updateError, updateResult) => {
          if (updateError) {
            logger.error(updateError);
            return next(updateResult);
          }
        });
      }

      // .......
      try {
        misQueryMod(
          `insert into magodmis.draft_dc_inv_register(DC_InvType, InvoiceFor, OrderScheduleNo, DC_No, DC_Date, DC_Fin_Year, PymtAmtRecd, PaymentMode, PaymentReceiptDetails, Cust_Code, Cust_Name, Cust_Address, Cust_Place, Cust_State, Cust_StateId, PIN_Code, Del_Address, GSTNo, PO_No, PO_Date, Net_Total, TptCharges, Discount, AssessableValue, TaxAmount, Del_Chg, InvTotal, Round_Off, GrandTotal, Total_Wt, DCStatus, DespatchDate, TptMode, VehNo, Remarks, PO_Value, PaymentTerms, BillType, PAN_No, Del_ContactName, Del_ContactNo) values(
        '${req.body.invRegisterData.DC_InvType || ""}', '${
            req.body.invRegisterData.InvoiceFor || ""
          }', '${
            req.body.invRegisterData.InvoiceFor || ""
          }', '${newDCNo}', '${todayDate}', 'finyear', '${
            req.body.invRegisterData.PymtAmtRecd || 0.0
          }', '${req.body.invRegisterData.PaymentMode || ""}', '${
            req.body.invRegisterData.PaymentReceiptDetails || ""
          }', '${req.body.invRegisterData.Cust_Code}', '${
            req.body.invRegisterData.Cust_Name
          }', '${req.body.invRegisterData.Cust_Address || ""}', '${
            req.body.invRegisterData.Cust_Place || ""
          }', '${req.body.invRegisterData.Cust_State || ""}', '${
            req.body.invRegisterData.Cust_StateId || "00"
          }', '${req.body.invRegisterData.PIN_Code || ""}', '${
            req.body.invRegisterData.Del_Address || ""
          }', '${req.body.invRegisterData.GSTNo || ""}', '${
            req.body.invRegisterData.PO_No || ""
          }', '${todayDate}', '${
            req.body.invRegisterData.Net_Total || 0.0
          }', '${req.body.invRegisterData.TptCharges || 0.0}', '${
            req.body.invRegisterData.Discount || 0.0
          }', '${req.body.invRegisterData.AssessableValue || 0.0}', '${
            req.body.invRegisterData.TaxAmount || 0.0
          }', '${req.body.invRegisterData.Del_Chg || 0.0}', '${
            req.body.invRegisterData.InvTotal || 0.0
          }', '${req.body.invRegisterData.Round_Off || 0.0}', '${
            req.body.invRegisterData.GrandTotal || 0.0
          }', '${
            req.body.invRegisterData.Total_Wt || 0.0
          }', '${DCStatus}', '${dispatchDate}', '${
            req.body.invRegisterData.TptMode || ""
          }', '${req.body.invRegisterData.VehNo || ""}', '${
            req.body.invRegisterData.Remarks || ""
          }', '${req.body.invRegisterData.PO_Value || 0.0}', '${
            req.body.invRegisterData.PaymentTerms || ""
          }', '${req.body.invRegisterData.BillType || "Cash"}', '${
            req.body.invRegisterData.PAN_No || ""
          }', '${req.body.invRegisterData.Del_ContactName || ""}', '${
            req.body.invRegisterData.Del_ContactNo || ""
          }'
      )
`,
          (err, registerData) => {
            if (err) {
              console.log("errrr", err);
            } else {
              // console.log("registerdata", registerData);
            }

            // updating the material issue register table if the materials are imported from iv
            try {
              misQueryMod(
                `UPDATE magodmis.material_issue_register
            SET
                PkngDcNo = '${newDCNo}',
                PkngDCDate = NOW(),
                IVStatus = '${DCStatus}',
                Dc_ID = '${registerData.insertId}'
            WHERE
                (Iv_Id = '${req.body.invRegisterData.Iv_Id}')`,

                (err, updateMtrlIssueRegister) => {
                  if (err) logger.error(err);
                }
              );
            } catch (error) {
              next(error);
            }
            // insert into detailssssss
            let flag = 0;

            for (let i = 0; i < req.body.invDetailsData.length; i++) {
              const element = req.body.invDetailsData[i];
              try {
                misQueryMod(
                  `insert into magodmis.draft_dc_inv_details(DC_Inv_No, DC_Inv_Srl, Cust_Code, Dwg_No, Mtrl, Material, Qty, Unit_Wt, DC_Srl_Wt, Unit_Rate, DC_Srl_Amt, Excise_CL_no, DespStatus) values(${
                    registerData.insertId
                  }, ${i + 1}, '${req.body.invRegisterData.Cust_Code}', '${
                    element.Dwg_No
                  }', '${element.Mtrl}', '${element.Material}', '${
                    element.Qty || 0
                  }', '${element.Unit_Wt || 0.0}', '${
                    element.DC_Srl_Wt || 0.0
                  }', '${element.Unit_Rate || 0.0}', '${
                    element.DC_Srl_Amt || 0.0
                  }', '${element.Excise_CL_no}', '${DCStatus}')`,
                  (err, detailsData) => {
                    if (err) {
                      console.log("errr", err);
                    } else {
                    }
                  }
                );
              } catch (error) {
                next(error);
              }
            }
            if (req.body.invTaxData?.length > 0) {
              for (let i = 0; i < req.body.invTaxData.length; i++) {
                const element = req.body.invTaxData[i];
                try {
                  misQueryMod(
                    `INSERT INTO magodmis.dc_inv_taxtable (Dc_inv_No, DcTaxID, TaxID, Tax_Name, TaxOn, TaxableAmount, TaxPercent, TaxAmt) values('${
                      registerData.insertId
                    }', '${i + 1}', '${element.TaxID}', '${
                      element.Tax_Name
                    }', '${element.TaxOn}', '${element.TaxableAmount}', '${
                      element.TaxPercent
                    }', '${element.TaxAmt}')`,
                    (err, taxData) => {
                      if (err) logger.error(err);
                    }
                  );
                } catch (error) {
                  next(error);
                }
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
                      DATE_ADD(DespatchDate, INTERVAL 1 DAY) AS DespatchDate,
                      DATE_FORMAT(DC_Date, '%d/%m/%Y') AS DC_Date,
                      DATE_FORMAT(DC_Date, '%d/%m/%Y') AS Printable_DC_Date,
                      DATE_FORMAT(PO_Date, '%d/%m/%Y') AS Printable_PO_Date,
                      DATE_FORMAT(Inv_Date, '%d/%m/%Y') AS Inv_Date,
                      DATE_FORMAT(Inv_Date, '%d/%m/%Y') AS Printable_Inv_Date,
                      DATE_FORMAT(DespatchDate, '%d/%m/%Y') AS Printable_DespatchDate
                    FROM
                        magodmis.draft_dc_inv_register
                      WHERE
                          magodmis.draft_dc_inv_register.DC_Inv_No = ${registerData?.insertId}`,
                  (err, invRegisterData) => {
                    if (err) logger.error(err);
                    res.send({
                      flag: 1,
                      message: "PN Created",
                      invRegisterData: invRegisterData,
                    });
                  }
                );
              } catch (error) {
                next(error);
              }
            } else if (flag === 0) {
              res.send({
                message: "Error in Backend",
                flag: 0,
              });
            } else {
              res.send({
                message: "Uncaught Error, Check with backend",
                flag: 0,
              });
            }
          }
        );
      } catch (error) {
        next(error);
      }
    });
  } catch (error) {
    console.error("An error occurred:", error);
    next(error);
  }
});

InvoiceRouter.post("/getListData", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT 
          *, DATE_FORMAT(DC_Date, '%d/%m/%Y') AS DC_Date
        FROM
          magodmis.draft_dc_inv_register
        WHERE
          InvoiceFor = '${req.body.PNList}'
        AND DCStatus = '${req.body.Status}'
          ORDER BY DC_Inv_No DESC`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
        // console.log("here", data.length);
      }
    );
  } catch (error) {
    next(error);
  }
});

InvoiceRouter.post("/invoiceDetails", async (req, res, next) => {
  if (req.body?.DCInvNo) {
    try {
      misQueryMod(
        `SELECT
            *,
            DATE_ADD(DespatchDate, INTERVAL 1 DAY) AS DespatchDate,
            DATE_FORMAT(DC_Date, '%d/%m/%Y') AS DC_Date,
            DATE_FORMAT(DC_Date, '%d/%m/%Y') AS Printable_DC_Date,
            DATE_FORMAT(PO_Date, '%d/%m/%Y') AS Printable_PO_Date,
            DATE_FORMAT(Inv_Date, '%d/%m/%Y') AS Inv_Date,
            DATE_FORMAT(Inv_Date, '%d/%m/%Y') AS Printable_Inv_Date,
            DATE_FORMAT(DespatchDate, '%d/%m/%Y') AS Printable_DespatchDate
          FROM
            magodmis.draft_dc_inv_register
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
  }
});

InvoiceRouter.post("/getTaxDataInvoice", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT 
          *
        FROM
            magod_setup.taxdb
        WHERE
            EffectiveTO >= NOW() AND IGST = 0`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

InvoiceRouter.post("/updateInvoice", async (req, res, next) => {
  // console.log("reeeeeee", req.body);
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
        PymtAmtRecd = '${req.body.invRegisterData.PymtAmtRecd}',
        PaymentMode =  '${req.body.invRegisterData.PaymentMode}',
        PaymentReceiptDetails =  '${
          req.body.invRegisterData.PaymentReceiptDetails
        }',
        PO_No =  '${req.body.invRegisterData.PO_No}',
        Cust_Address =  '${req.body.invRegisterData.Cust_Address}',
        Cust_Place = '${req.body.invRegisterData.Cust_Place}',
        Cust_State =  '${req.body.invRegisterData.Cust_State}',
        PIN_Code = '${req.body.invRegisterData.PIN_Code}',
        Del_Address =  '${req.body.invRegisterData.Del_Address}',
        GSTNo =  '${req.body.invRegisterData.GSTNo}', 
        Net_Total = '${req.body.invRegisterData.Net_Total}', 
        TptCharges =  '${req.body.invRegisterData.TptCharges}',
        Discount =  '${req.body.invRegisterData.Discount}',
        AssessableValue =  '${req.body.invRegisterData.AssessableValue}', 
        TaxAmount =  '${req.body.invRegisterData.TaxAmount}',
        Del_Chg =  '${req.body.invRegisterData.Del_Chg}', 
        InvTotal =  '${req.body.invRegisterData.InvTotal}',
        Round_Off =  '${req.body.invRegisterData.Round_Off}',
        GrandTotal = '${req.body.invRegisterData.GrandTotal}', 
        Total_Wt = '${req.body.invRegisterData.Total_Wt}', 
        DespatchDate = '${dispatchDate}',
        TptMode = '${req.body.invRegisterData.TptMode}',
        VehNo = '${req.body.invRegisterData.VehNo}',
        Del_ContactName = '${req.body.invRegisterData.Del_ContactName || ""}',
        Del_ContactNo = '${req.body.invRegisterData.Del_ContactNo || ""}',
        Remarks = '${req.body.invRegisterData.Remarks || ""}',
        PO_Value =   '${req.body.invRegisterData.PO_Value}', 
        BillType = '${req.body.invRegisterData.BillType}',
        PaymentTerms = '${req.body.invRegisterData.PaymentTerms}'
        where DC_Inv_No = ${req.body.invRegisterData.DC_Inv_No}`,

      (err, updateRegister) => {
        if (err) {
          console.log("errrr", err);
        } else {
          let flag = 1;

          for (let i = 0; i < req.body.invDetailsData.length; i++) {
            const element = req.body.invDetailsData[i];

            try {
              misQueryMod(
                `UPDATE magodmis.draft_dc_inv_details 
                SET 
                    Unit_Wt = '${element.Unit_Wt}',
                    DC_Srl_Wt = '${element.DC_Srl_Wt}',
                    Unit_Rate = '${element.Unit_Rate}',
                    DC_Srl_Amt = '${element.DC_Srl_Amt}',
                    Excise_CL_no = '${element.Excise_CL_no}'
                WHERE
                    (Draft_dc_inv_DetailsID = '${element.Draft_dc_inv_DetailsID}')
                        AND (DC_Inv_No = '${element.DC_Inv_No}')
                        AND (DC_Inv_Srl = '${element.DC_Inv_Srl}')`,
                (err, updateDetails) => {
                  if (err) logger.error(err);
                }
              );
            } catch (error) {
              next(error);
            }
          }

          try {
            misQueryMod(
              `DELETE FROM magodmis.dc_inv_taxtable WHERE (Dc_inv_No = '${req.body.invRegisterData.DC_Inv_No}')`,
              (err, taxDelete) => {
                if (err) logger.error(err);
              }
            );
          } catch (error) {
            next(error);
          }
          if (req.body.invTaxData?.length > 0) {
            for (let i = 0; i < req.body.invTaxData.length; i++) {
              const element = req.body.invTaxData[i];
              try {
                misQueryMod(
                  `INSERT INTO magodmis.dc_inv_taxtable (Dc_inv_No, DcTaxID, TaxID, Tax_Name, TaxOn, TaxableAmount, TaxPercent, TaxAmt) values('${
                    req.body.invRegisterData.DC_Inv_No
                  }', '${i + 1}', '${element.TaxID}', '${element.Tax_Name}', '${
                    element.TaxOn
                  }', '${element.TaxableAmount}', '${element.TaxPercent}', '${
                    element.TaxAmt
                  }')`,
                  (err, taxData) => {
                    if (err) logger.error(err);
                  }
                );
              } catch (error) {
                next(error);
              }
            }
            flag = 1;
          } else {
            flag = 1;
          }
          if (flag === 1) {
            res.send({
              flag: 1,
              message: "PN details saved",
            });
          } else if (flag === 0) {
            res.send({
              message: "Error in Backend",
              flag: 0,
            });
          } else {
            res.send({
              message: "Uncaught Error, Check with backend",
              flag: 0,
            });
          }
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

InvoiceRouter.post("/createInvoice", async (req, res, next) => {
  const DCStatus = "Dispatched";
  try {
    misQueryMod(
      `SELECT
            Inv_No
        FROM
            magodmis.draft_dc_inv_register
        WHERE
            Inv_No IS NOT NULL
                AND Inv_No != 'Cancelled'
                AND Inv_No != 'undefined'
                AND Inv_No != ''
                AND Inv_No != 'null'
                AND Inv_No != 'NaN'
                AND DCStatus != 'Cancelled'
        ORDER BY Inv_No DESC
        LIMIT 1`,
      (err, old_inv_no) => {
        if (err) logger.error(err);
        var num = old_inv_no[0].Inv_No.match(/\d+/g);
        // num[0] will be 21
        var letr = old_inv_no[0].Inv_No.match(/[a-zA-Z]+/g);
        // got new inv number
        var newInv = letr + String(parseInt(num[0]) + 1);
        // update register
        try {
          misQueryMod(
            `UPDATE magodmis.draft_dc_inv_register SET Inv_No = '${newInv}',
            DCStatus = '${DCStatus}',
            Inv_Date = now()
            WHERE (DC_Inv_No = '${req.body.invRegisterData.DC_Inv_No}')`,
            (err, updateRegister) => {
              if (err) logger.error(err);
              // update details
              try {
                misQueryMod(
                  `UPDATE magodmis.draft_dc_inv_details SET
                  DespStatus = '${DCStatus}'
                  WHERE (DC_Inv_No = '${req.body.invRegisterData.DC_Inv_No}')`,
                  (err, updateDetails) => {
                    if (err) logger.error(err);
                    // updating the material issue register
                    try {
                      misQueryMod(
                        `UPDATE magodmis.material_issue_register SET IVStatus = '${DCStatus}' WHERE (Dc_ID = '${req.body.invRegisterData.DC_Inv_No}')`,
                        (err, InMtrlIssueRegister) => {
                          if (err) logger.error(err);
                        }
                      );
                    } catch (error) {
                      next(error);
                    }
                    // select is not requried in pn
                    try {
                      misQueryMod(
                        `SELECT
                          *,
                          DATE_ADD(DespatchDate, INTERVAL 1 DAY) AS DespatchDate,
                          DATE_FORMAT(DC_Date, '%d/%m/%Y') AS DC_Date,
                          DATE_FORMAT(DC_Date, '%d/%m/%Y') AS Printable_DC_Date,
                          DATE_FORMAT(PO_Date, '%d/%m/%Y') AS Printable_PO_Date,
                          DATE_FORMAT(Inv_Date, '%d/%m/%Y') AS Inv_Date,
                          DATE_FORMAT(Inv_Date, '%d/%m/%Y') AS Printable_Inv_Date,
                          DATE_FORMAT(DespatchDate, '%d/%m/%Y') AS Printable_DespatchDate
                        FROM
                            magodmis.draft_dc_inv_register
                            WHERE (DC_Inv_No = ${req.body.invRegisterData.DC_Inv_No})`,
                        (err, registerData) => {
                          if (err) logger.error(err);
                          res.send({
                            flag: 1,
                            message: "Invoice created",
                            registerData: registerData,
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
      }
    );
  } catch (error) {
    next(error);
  }
});

InvoiceRouter.post("/getWholePrintData", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT 
          *,
          DATE_FORMAT(PO_Date, "%d/%m/%Y") as PO_Date,
          DATE_FORMAT(DC_Date, '%d/%m/%Y') AS DC_Date,
          DATE_FORMAT(Inv_Date, '%d/%m/%Y') AS Inv_Date,
          DATE_FORMAT(Dc_inv_Date, '%d/%m/%Y') AS Dc_inv_Date,
          DATE_FORMAT(DespatchDate, '%d/%m/%Y') AS DespatchDate
        FROM
            magodmis.draft_dc_inv_register
                INNER JOIN
            magodmis.draft_dc_inv_details ON magodmis.draft_dc_inv_register.DC_Inv_No = magodmis.draft_dc_inv_details.DC_Inv_No
        WHERE
            magodmis.draft_dc_inv_register.DC_Inv_No = ${req.body?.DCInvNo} `,
      (err, detailsAndRegisterData) => {
        if (err) logger.error(err);
        try {
          misQueryMod(
            `SELECT 
                *
            FROM
                magodmis.dc_inv_taxtable
            WHERE
                magodmis.dc_inv_taxtable.DC_Inv_No = ${req.body?.DCInvNo}
            ORDER BY DcTaxID
            `,
            (err, taxData) => {
              if (err) logger.error(err);
              res.send([
                {
                  detailsAndRegisterData: detailsAndRegisterData,
                  taxData: taxData,
                },
              ]);
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

InvoiceRouter.get("/getIVList", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT 
          *, DATE_FORMAT(IV_Date, '%d/%m/%Y') AS IV_Date
      FROM
          magodmis.material_issue_register
      WHERE
          magodmis.material_issue_register.PkngDcNo IS NULL
              AND magodmis.material_issue_register.Cust_code = '0000'
              AND magodmis.material_issue_register.IVStatus LIKE 'Draft'
      ORDER BY magodmis.material_issue_register.Iv_Id DESC`,
      (err, IVList) => {
        if (err) logger.error(err);
        res.send(IVList);
      }
    );
  } catch (error) {
    next(error);
  }
});
InvoiceRouter.post("/getIVDetails", async (req, res, next) => {
  // running the sql_mode=only_full_group_by query to resolve the group by error
  try {
    misQueryMod(
      `SET @@sql_mode = REPLACE(@@sql_mode, 'ONLY_FULL_GROUP_BY', '')`,
      (err, groupBy) => {
        if (err) {
          console.log("err", err);
        } else {
          // console.log("groupBy", groupBy);
        }
      }
    );
  } catch (error) {
    next(error);
  }
  // fetch the material data
  try {
    misQueryMod(
      `SELECT * FROM magodmis.mtrl_typeslist`,
      (err, allMaterials) => {
        if (err) {
          console.log("err", err);
        } else {
          const findExciseFromMaterial = (mtrl) => {
            for (let i = 0; i < allMaterials.length; i++) {
              const element = allMaterials[i];
              if (element.Material === mtrl) {
                return element.ExciseClNo;
              }
            }
          };
          // fetching the iv details
          try {
            misQueryMod(
              `SELECT 
                *,
                SUM(Qty) AS Qty,
                SUM(TotalWeightCalculated) AS TotalWeightCalculated,
                SUM(TotalWeight) AS TotalWeight
              FROM
                  magodmis.mtrlissuedetails
              WHERE
                  Iv_Id = ${req.body.Iv_Id}
              GROUP BY Material`,
              (err, ivDetails) => {
                if (err) logger.error(err);
                let detailsData = [];
                for (let i = 0; i < ivDetails.length; i++) {
                  const element = ivDetails[i];
                  detailsData = [
                    ...detailsData,
                    {
                      Dwg_No: element.Material + " Scrap",
                      Mtrl: element.Material,
                      Material: element.Material,
                      Qty: element.Qty,
                      Unit_Wt: 1,
                      Excise_CL_no:
                        findExciseFromMaterial(element.Material)?.length > 0
                          ? findExciseFromMaterial(element.Material)
                          : "",
                      DC_Srl_Wt: element.Qty,
                      Unit_Rate: 0,
                      DC_Srl_Amt: 0,
                      PkngLevel: "Pkng1",
                      InspLevel: "Insp1",
                    },
                  ];
                }
                res.send({
                  flag: 1,
                  message: "Import from IV Successfully",
                  detailsData: detailsData,
                  Iv_Id: ivDetails[0].Iv_Id,
                });
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

InvoiceRouter.post("/insertRunNoRow", async (req, res, next) => {
  const { unit, srlType, ResetPeriod, ResetValue, VoucherNoLength, prefix } =
    req.body;

  const unitName = `${unit}`;
  const date = new Date();
  const year = date.getFullYear();
  const startYear = date.getMonth() >= 3 ? year : year - 1;
  const endYear = startYear + 1;

  const financialYearStartDate = new Date(`${startYear}-04-01`);
  const financialYearEndDate = new Date(`${endYear}-04-01`);

  const formattedStartDate = financialYearStartDate.toISOString().slice(0, 10);
  const formattedEndDate = financialYearEndDate.toISOString().slice(0, 10);

  const getYear =
    date.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  const yearParts = getYear.split("-");
  const startYearShort = yearParts[0].slice(-2);
  const endYearShort = yearParts[1].slice(-2);
  const finYear = `${startYearShort}/${endYearShort}`;

  console.log("finYear", finYear);

  try {
    const selectQuery = `
    SELECT COUNT(Id) FROM magod_setup.magod_runningno  WHERE SrlType='${srlType}'
    AND UnitName='${unit}' AND Period='${finYear}'
    `;

    setupQueryMod(selectQuery, (selectError, selectResult) => {
      if (selectError) {
        logger.error(selectError);
        return next(selectResult);
      }

      const count = selectResult[0]["COUNT(Id)"];

      if (count === 0) {
        // If count is 0, execute the INSERT query
        const insertQuery = `
          INSERT INTO magod_setup.magod_runningno
          (UnitName, SrlType, ResetPeriod, ResetValue, EffectiveFrom_date, Reset_date, Running_No, Prefix, Length, Period, Running_EffectiveDate)
          VALUES ('${unit}', '${srlType}', '${ResetPeriod}', ${ResetValue}, '${formattedStartDate}', '${formattedEndDate}',${ResetValue}, '${prefix}', ${VoucherNoLength}, '${finYear}', CurDate());
        `;

        // Execute the INSERT query
        setupQueryMod(insertQuery, (insertError, insertResult) => {
          if (insertError) {
            logger.error(insertError);
            return next(insertResult);
          }

          res.json({ message: "Record inserted successfully." });
        });
      } else {
        res.json({ message: "Record already exists." });
      }
    });
  } catch (error) {
    console.error("An error occurred:", error);
    next(error);
  }
});
module.exports = InvoiceRouter;
