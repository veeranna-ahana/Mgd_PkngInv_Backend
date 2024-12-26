const pnrdcRouter = require("express").Router();
var createError = require("http-errors");
// const { createFolder, copyallfiles } = require("../helpers/folderhelper");
const { createFolder, copyallfiles } = require("../../helpers/folderhelper");
const {
  misQueryMod,
  setupQuery,
  setupQueryMod,
} = require("../../helpers/dbconn");
const req = require("express/lib/request");
const { sendDueList } = require("../../helpers/sendmail");
const { logger } = require("../../helpers/logger");

pnrdcRouter.get("/getAllCust", async (req, res, next) => {
  try {
    misQueryMod(
      `Select * from magodmis.cust_data order by Cust_name ASC`,
      (err, data) => {
        if (err) logger.error(err);
        // console.log("data", data);
        logger.info("successfully fetched cust_data");
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/getCustomerDetails", async (req, res, next) => {
  const cust_code = req.body.custCode;

  try {
    misQueryMod(
      `select * from magodmis.cust_data WHERE Cust_Code = ${cust_code}`,
      (err, data) => {
        if (err) logger.error(err);
        // console.log("data", data);
        logger.info(
          `successfully fetched cust_data with Cust_Code=${cust_code}`
        );
        res.send(data[0]);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/postCustDetails", async (req, res, next) => {
  const { Cust_Code, Cust_Address, dcStatus } = req.body;

  try {
    misQueryMod(
      `INSERT INTO magodmis.draft_dc_inv_register (IsDC, DC_InvType, Cust_Code, Cust_Name, Cust_Address, Cust_Place, Cust_State, Cust_StateId, DCStatus, PIN_Code, GSTNo, Del_Address, BillType)
      SELECT TRUE, 'ReturnableDC', c.Cust_Code, c.Cust_name, '${Cust_Address}', c.City, c.State, c.StateId, '${dcStatus}', c.Pin_Code, c.GSTNo, 'Consignee Address', 'DC'
      FROM magodmis.cust_data c
      WHERE c.Cust_Code = ${Cust_Code}`,
      async (err, data) => {
        if (err) {
          logger.error(err);
          return next(err);
        }
        logger.info("successfully inserted data into draft_dc_inv_register");

        try {
          const selectQuery = `SELECT LAST_INSERT_ID() AS DcId`;
          misQueryMod(selectQuery, (err, data) => {
            if (err) {
              logger.error(err);
              return next(err);
            }
            const lastInsertedId = data[0].DcId;
            // console.log("lastInsertedId", lastInsertedId);
            logger.info("successfully fetched last inserted DcId");
            res.send({ DcId: lastInsertedId });
          });
        } catch (error) {
          next(error);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.get("/getStates", async (req, res, next) => {
  try {
    setupQueryMod(
      `Select distinct(State) from magod_setup.state_codelist order by State`,
      (err, data) => {
        if (err) logger.error(err);
        // console.log("data", data);
        logger.info("successfully fetched States from state_codelist");
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// pnrdcRouter.post("/loadTaxes", async (req, res, next) => {
//   const { stateId, unitStateId, isGovOrg, isForiegn, gstNo, UnitGSTNo } =
//     req.body;
//   // console.log("StateID", req.body);

//   try {
//     if (stateId === unitStateId) {
//       insertQuery = `SELECT t.TaxID as DCTaxId, 1 as TaxId, t.TaxName, t.TaxOn, 0 as TaxableAmount, t.Tax_Percent, 0 as TaxAmount
//       FROM magod_setup.taxdb t WHERE t.IGST = 0 AND t.UnderGroup NOT LIKE 'INCOMETAX' AND DATE(t.EffectiveTO) >= CURRENT_DATE();`;
//     } else {
//       insertQuery = `
//       SELECT  t.TaxID as DCTaxId, 1 as TaxId, t.TaxName, t.TaxOn, 0 as TaxableAmount, t.Tax_Percent, 0 as TaxAmount
//       FROM magod_setup.taxdb t WHERE t.IGST = 1 AND t.UnderGroup NOT LIKE 'INCOMETAX' AND DATE(t.EffectiveTO) >= CURRENT_DATE();`;
//     }

//     misQueryMod(insertQuery, (err, insertResult) => {
//       if (err) {
//         logger.error(err);
//         return next(err);
//       }
//       res.send(insertResult);
//     });
//   } catch (error) {
//     logger.error(error);
//     next(error);
//   }
// });

pnrdcRouter.post("/loadTaxes", async (req, res, next) => {
  const { stateId, unitStateId, isGovOrg, isForiegn, gstNo, UnitGSTNo } =
    req.body;

  // console.log("gstNo", req.body.gstNo);
  // console.log("isGovOrg", req.body.isGovOrg);
  // console.log("isForiegn", req.body.isForiegn);

  try {
    let insertQuery = "";

    if (isGovOrg === 1) {
      // No taxes for government organizations or No Tax for Exports
      insertQuery = `SELECT t.TaxID AS DCTaxId, 1 AS TaxId, t.TaxName, t.TaxOn, 0 AS TaxableAmount, t.Tax_Percent, 0 AS TaxAmount
      FROM magod_setup.taxdb t WHERE TaxId IS NULL AND DATE(t.EffectiveTO) > CURRENT_DATE();`;
    } else if (isForiegn === 1) {
      // No taxes for government organizations or No Tax for Exports
      insertQuery = `SELECT t.TaxID AS DCTaxId, 1 AS TaxId, t.TaxName, t.TaxOn, 0 AS TaxableAmount, t.Tax_Percent, 0 AS TaxAmount
      FROM magod_setup.taxdb t WHERE IGST !=0 AND t.UNDERGROUP != 'INCOMETAX' AND DATE(t.EffectiveTO) > CURRENT_DATE();`;
    } else if (gstNo === null) {
      // Cust GST unregistered then Tax as per state
      insertQuery = `SELECT t.TaxID AS DCTaxId, 1 AS TaxId, t.TaxName, t.TaxOn, 0 AS TaxableAmount, t.Tax_Percent, 0 AS TaxAmount
      FROM magod_setup.taxdb t WHERE t.IGST = 0 AND t.UnderGroup !=  'INCOMETAX' AND DATE(t.EffectiveTO) > CURRENT_DATE();
      ;
      `;
    } else if (stateId !== unitStateId) {
      // If Out of State tax IGST
      insertQuery = `
        SELECT t.TaxID AS DCTaxId, 1 AS TaxId, t.TaxName, t.TaxOn, 0 AS TaxableAmount, t.Tax_Percent, 0 AS TaxAmount
        FROM magod_setup.taxdb t WHERE t.IGST != 0 AND t.UnderGroup != 'INCOMETAX' AND DATE(t.EffectiveTO) > CURRENT_DATE();
      `;
    } else if (gstNo === UnitGSTNo) {
      // Unit Transfer Within State No Taxes
      insertQuery = `
        SELECT t.TaxID AS DCTaxId, 1 AS TaxId, t.TaxName, t.TaxOn, 0 AS TaxableAmount, t.Tax_Percent, 0 AS TaxAmount
        FROM magod_setup.taxdb t WHERE TaxId IS NULL AND DATE(t.EffectiveTO) > CURRENT_DATE();
      `;
    } else {
      // Default case, apply applicable taxes
      insertQuery = `
        SELECT t.TaxID AS DCTaxId, 1 AS TaxId, t.TaxName, t.TaxOn, 0 AS TaxableAmount, t.Tax_Percent, 0 AS TaxAmount
        FROM magod_setup.taxdb t WHERE t.IGST = 0 AND t.UnderGroup != 'INCOMETAX' AND DATE(t.EffectiveTO) > CURRENT_DATE();
      `;
    }

    misQueryMod(insertQuery, (err, insertResult) => {
      if (err) {
        logger.error(err);
        logger.info("successfully fetched taxes from taxdb");
        return next(err);
      }
      res.send(insertResult);
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

pnrdcRouter.post("/taxSelection", (req, res, next) => {
  const { dcInvNo, selectedTax } = req.body;
  let selectResult;

  // Execute the DELETE query to remove existing tax records
  misQueryMod(
    `DELETE FROM magodmis.dc_inv_taxtable WHERE Dc_Inv_No = ${dcInvNo}`,
    (deleteErr, deleteData) => {
      if (deleteErr) {
        logger.error(deleteErr);
        return next(deleteErr);
      }
      logger.info(
        `successfully deleted data from dc_inv_taxtable with Dc_Inv_No = ${dcInvNo}`
      );

      // Insert new tax records using a loop
      selectedTax.forEach((tax, index, array) => {
        const insertTaxQuery = `
        INSERT INTO magodmis.dc_inv_taxtable (Dc_inv_No, DCTaxId, TaxId, Tax_Name, TaxOn, TaxableAmount, TaxPercent, TaxAmt)
        VALUES (
          ${dcInvNo},
          ${tax.DCTaxId},
          ${tax.TaxId},
          '${tax.TaxName}',
          '${tax.TaxOn}',
          ${tax.TaxableAmount},
          '${tax.Tax_Percent}',
          '${tax.TaxAmount}'
        )
      `;

        misQueryMod(insertTaxQuery, (insertErr, insertData) => {
          if (insertErr) {
            logger.error(insertErr);
            return next(insertErr);
          }
          logger.info("successfully inserted data into dc_inv_taxtable");

          // Check if it's the last iteration
          if (index === array.length - 1) {
            // Execute the SELECT query to get the updated tax records
            const selectQuery = `SELECT * FROM magodmis.dc_inv_taxtable WHERE Dc_Inv_No = ${dcInvNo}`;
            misQueryMod(selectQuery, (selectErr, selectData) => {
              if (selectErr) {
                logger.error(selectErr);
                return next(selectErr);
              }
              logger.info("successfully fetched tax data from dc_inv_taxtable");

              // Send the selected tax records in the response
              res.send(selectData);
            });
          }
        });
      });
    }
  );
});

pnrdcRouter.post("/updateCust", async (req, res, next) => {
  const {
    Cust_Code,
    Cust_Name,
    custState,
    custStateId,
    deliveryState,
    refernce,
    custAddress,
    custCity,
    custPin,
    deliveryAddress,
    gstNo,
    dcInvNo,
  } = req.body;

  try {
    // Execute the SELECT query to get StateCode
    setupQueryMod(
      `SELECT StateCode FROM magod_setup.state_codelist WHERE State="${deliveryState}"`,
      async (selectErr, selectData) => {
        if (selectErr) {
          logger.error(selectErr);
          return next(selectErr);
        }

        logger.info("successfully fetched StateCode data from state_codelist");

        const stateCode = selectData[0]?.StateCode || ""; // Extract StateCode

        // Execute the UPDATE query with the retrieved StateCode
        misQueryMod(
          `UPDATE magodmis.draft_dc_inv_register
           SET
           Cust_Code = '${Cust_Code}',
           Cust_Name = '${Cust_Name}',
           Cust_Address = '${custAddress}',
           Cust_State = '${custState}',
           Cust_StateId = '${custStateId}',
           Cust_Place = '${custCity}',
           PIN_Code = '${custPin}',
           Del_Address = '${deliveryAddress}',
           PO_No = '${refernce}',
           GSTNo = '${gstNo}',
           Del_StateId = '${stateCode}'
           WHERE DC_Inv_No = ${dcInvNo}`,
          async (updateErr, updateData) => {
            if (updateErr) {
              logger.error(updateErr);
              return next(updateErr);
            }
            logger.info(
              `successfully updated draft_dc_inv_register for DC_Inv_No=${dcInvNo}`
            );

            // Handle the response or send it back to the client
            res.send({ status: "Updated" });
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/updateSave", async (req, res, next) => {
  const {
    unitName,
    dcNo,
    dcInvNo,
    dcDate,
    dcType,
    dcStatus,
    selectedCustomer,
    custName,
    custCode,
    reference,
    custAddress,
    custState,
    custCity,
    custPin,
    gstNo,
    deliveryAddress,
    deliveryState,
    deliveryContactName,
    deliveryContactNo,
    inspectedBy,
    packedBy,
    selectedMode,
    scrapWeight,
    vehicleDetails,
    eWayRef,
    totalWeight,
    taxableAmount,
    taxAmt,

    // magodmis.draft_dc_inv_details
    tableData,

    // magodmis.dc_inv_taxtable
    selectedTax,
  } = req.body;

  // console.log("tableData", req.body.tableData);
  // console.log("DCInvNo", req.body.dcInvNo);

  try {
    // Execute the SELECT query to get StateCode
    setupQueryMod(
      `SELECT StateCode FROM magod_setup.state_codelist WHERE State="${deliveryState}"`,
      async (selectErr, selectData) => {
        if (selectErr) {
          logger.error(selectErr);
          return next(selectErr);
        }

        logger.info(
          `successfully fetched StateCode from state_codelist with State="${deliveryState}"`
        );

        const stateCode = selectData[0]?.StateCode || ""; // Extract StateCode

        // Execute the UPDATE query with the retrieved StateCode
        misQueryMod(
          `UPDATE magodmis.draft_dc_inv_register
          SET
          Cust_Name = '${custName}',
          PO_No = '${reference}',
          Cust_Address = '${custAddress}',
          Cust_State = '${custState}',
          Cust_Place = '${custCity}',
          PIN_Code = '${custPin}',
          GSTNo = '${gstNo}',
          Del_Address = '${deliveryAddress}',
          InspBy = '${inspectedBy}',
          PackedBy = '${packedBy}',
          TptMode = '${selectedMode}',
          ScarpWt = ${scrapWeight},
          Total_Wt = ${totalWeight},
          VehNo = '${vehicleDetails}',
          Del_ContactName='${deliveryContactName}',
          Del_ContactNo= '${deliveryContactNo}',
          EWayBillRef = '${eWayRef}',
          Del_StateId = '${stateCode}',
          Net_Total = '${taxableAmount}',
          TaxAmount = '${taxAmt}'
          WHERE DC_Inv_No = ${dcInvNo}`,
          async (updateErr, updateData) => {
            if (updateErr) {
              logger.error(updateErr);
              return next(updateErr);
            }
            logger.info(
              `successfully updated draft_dc_inv_register for DC_Inv_No = ${dcInvNo}`
            );

            try {
              // Update the draft_dc_inv_details table
              for (const row of tableData) {
                const updateDetailsQuery = `
                  UPDATE magodmis.draft_dc_inv_details
                  SET
                  Cust_Code = '${custCode}',
                  Qty = ${row.Qty},
                  DC_Srl_Wt = '${row.DC_Srl_Wt}',
                  Unit_Rate = '${row.Unit_Rate}',
                  DC_Srl_Amt = '${row.DC_Srl_Amt}'
                  WHERE Draft_dc_inv_DetailsID = ${row.Draft_dc_inv_DetailsID} 
                `;

                await misQueryMod(updateDetailsQuery, async (err, data) => {
                  if (err) {
                    logger.error(err);

                    throw err;
                  }
                  logger.info("successfully updated draft_dc_inv_details");
                });
              }

              const deleteTaxQuery = `
                DELETE FROM magodmis.dc_inv_taxtable WHERE Dc_Inv_No = ${dcInvNo}
              `;

              await misQueryMod(deleteTaxQuery, async (err, data) => {
                if (err) {
                  logger.error(err);
                  throw err;
                }
                logger.info(
                  `successfully deleted data from dc_inv_taxtable with Dc_Inv_No=${dcInvNo}`
                );

                if (selectedTax.length !== 0) {
                  for (const tax of selectedTax) {
                    const insertTaxQuery = `
                      INSERT INTO magodmis.dc_inv_taxtable (Dc_inv_No, DCTaxId, TaxId, Tax_Name, TaxOn, TaxableAmount, TaxPercent, TaxAmt)
                      VALUES (
                        ${dcInvNo},
                        ${tax.DcTaxID},
                        ${tax.TaxID},
                        '${tax.Tax_Name}',
                        '${tax.TaxOn}',
                        ${tax.TaxableAmount},
                        '${tax.TaxPercent}',
                        '${tax.TaxAmt}'
                      )
                    `;
                    await misQueryMod(insertTaxQuery, async (err, data) => {
                      if (err) {
                        logger.error(err);
                        throw err;
                      }
                      logger.info(
                        "successfully inserted data into from dc_inv_taxtable"
                      );
                    });
                  }
                }

                res.json({ message: "Data updated successfully" });
              });
            } catch (error) {
              next(error);
            }
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.get("/materials", async (req, res, next) => {
  try {
    setupQueryMod(
      `SELECT Material, ExciseCLNo FROM magodmis.mtrl_typesList`,
      (err, data) => {
        if (err) logger.error(err);
        // console.log("data", data);
        logger.info(
          "successfully fetched Material, ExciseCLNo from mtrl_typesList"
        );
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/returnDetails", async (req, res, next) => {
  const {
    dcInvNo,
    custCode,
    partName,
    itemDescription,
    material,
    quantity,
    uom,
    unitRate,
    totalValue,
    hsnCode,
    weight,
    returned,
    srlType,
  } = req.body;

  try {
    misQueryMod(
      `SELECT 
      DC_Inv_Srl
  FROM
      magodmis.draft_dc_inv_details
  WHERE
  DC_Inv_No = '${dcInvNo}'
          
  ORDER BY DC_Inv_Srl DESC
  LIMIT 1`,
      (err, data) => {
        if (err) logger.error(err);
        // console.log("before", data);

        if (data.length > 0) {
          try {
            misQueryMod(
              `INSERT INTO magodmis.draft_dc_inv_details(DC_Inv_No, DC_Inv_Srl, Cust_Code, Dwg_Code, Dwg_No, Material, Qty, QtyReturned, Excise_CL_no, UOM, DC_Srl_Wt, Unit_Rate, DC_Srl_Amt,  SrlType)
              VALUES('${dcInvNo}', '${
                data[0].DC_Inv_Srl + 1
              }', '${custCode}', '${partName}','${itemDescription}',  '${material}', ${quantity}, ${returned}, '${hsnCode}','${uom}', ${weight}, ${unitRate}, ${totalValue}, '${srlType}')`,
              (err, data) => {
                if (err) logger.error(err);
              }
            );
            logger.info("successfully inserted data into draft_dc_inv_details");
            res.send({ status: "Inserted" });
          } catch (error) {
            next(error);
          }
        } else {
          // console.log("issuess", data);

          try {
            misQueryMod(
              `INSERT INTO magodmis.draft_dc_inv_details(DC_Inv_No, DC_Inv_Srl, Cust_Code, Dwg_Code, Dwg_No, Material, Qty, QtyReturned, Excise_CL_no, UOM, DC_Srl_Wt, Unit_Rate, DC_Srl_Amt,  SrlType)
              VALUES('${dcInvNo}', '1', '${custCode}', '${partName}','${itemDescription}',  '${material}', ${quantity}, ${returned}, '${hsnCode}'  ,'${uom}', ${weight}, ${unitRate}, ${totalValue}, '${srlType}')`,
              (err, data) => {
                if (err) logger.error(err);
              }
            );
            logger.info("successfully inserted data into draft_dc_inv_details");
            res.send({ status: "Inserted" });
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

pnrdcRouter.post("/getTableData", async (req, res, next) => {
  // console.log("dcInvNogetTableData", req.body.dcInvNo);
  try {
    misQueryMod(
      `select * from magodmis.draft_dc_inv_details  where DC_Inv_No = '${req.body.dcInvNo}'`,
      (err, data) => {
        if (err) logger.error(err);
        // console.log("data", data);
        logger.info("successfully selected data from draft_dc_inv_details");
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/deleteRow", async (req, res, next) => {
  const { dcInvNo, srl } = req.body;

  try {
    misQueryMod(
      `DELETE FROM magodmis.draft_dc_inv_details WHERE DC_Inv_No = '${dcInvNo}' AND DC_Inv_Srl = ${srl}`,
      async (err, data) => {
        if (err) {
          logger.error(err);
          return next(err);
        }
        logger.info(
          `successfully deleted data from draft_dc_inv_details with DC_Inv_No='${dcInvNo}' and DC_Inv_Srl=${srl}`
        );

        try {
          const selectQuery = `SELECT * FROM magodmis.draft_dc_inv_details WHERE DC_Inv_No = '${dcInvNo}'`;
          misQueryMod(selectQuery, (err, data) => {
            if (err) {
              logger.error(err);
              return next(err);
            }

            res.send(data);
          });
        } catch (error) {
          next(error);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

// pnrdcRouter.post("/createDC", async (req, res, next) => {
//   const { dcInvNo, unit, srlType, prefix } = req.body;

//   const date = new Date();
//   // const date = new Date("2024-04-01");
//   const year = date.getFullYear();

//   const getYear =
//     date.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
//   const yearParts = getYear.split("-");
//   const startYearShort = yearParts[0].slice(-2);
//   const endYearShort = yearParts[1].slice(-2);
//   const finYear = `${startYearShort}/${endYearShort}`;

//   console.log("finYear", finYear);

//   try {
//     const selectQuery = `
//     SELECT * FROM magod_setup.magod_runningno WHERE SrlType='${srlType}' AND UnitName='${unit}' ORDER BY Id DESC LIMIT 1;
//     `;

//     setupQueryMod(selectQuery, async (selectError, selectResult) => {
//       if (selectError) {
//         logger.error(selectError);
//         return next(selectResult);
//       }

//       let newDCNo = "";

//       if (selectResult && selectResult.length > 0) {
//         const lastRunNo = selectResult[0].Running_No;
//         const numericPart = parseInt(lastRunNo) + 1;

//         const paddedNumericPart = numericPart.toString().padStart(4, "0");

//         newDCNo = `${prefix}${paddedNumericPart}`;
//         console.log("New DCNo:", newDCNo);

//         // Update Running_No in magod_setup.magod_runningno
//         const updateRunningNoQuery = `
//           UPDATE magod_setup.magod_runningno
//           SET Running_No = ${numericPart}
//           WHERE SrlType='${srlType}' AND UnitName='${unit}' AND Period='${finYear}';
//         `;

//         setupQueryMod(updateRunningNoQuery, (updateError, updateResult) => {
//           if (updateError) {
//             logger.error(updateError);
//             return next(updateResult);
//           }
//         });
//       }

//       // Your existing update query
//       misQueryMod(
//         `UPDATE magodmis.draft_dc_inv_register
//         SET DC_Date = curdate(),
//         DC_No = '${newDCNo}',
//         DC_Fin_Year='${finYear}',
//         DCStatus = 'Despatched'
//         WHERE DC_Inv_No = '${dcInvNo}'`,
//         async (updateError, updateResult) => {
//           if (updateError) {
//             logger.error(updateError);
//             return next(updateResult);
//           }

//           // Your existing select query after update
//           const postUpdateSelectQuery = `SELECT * FROM magodmis.draft_dc_inv_register WHERE DC_Inv_No = ${dcInvNo}`;
//           misQueryMod(
//             postUpdateSelectQuery,
//             (postUpdateSelectError, postUpdateSelectResult) => {
//               if (postUpdateSelectError) {
//                 logger.error(postUpdateSelectError);
//                 return next(postUpdateSelectResult);
//               }

//               res.json(postUpdateSelectResult);
//             }
//           );
//         }
//       );
//     });
//   } catch (error) {
//     console.error("An error occurred:", error);
//     next(error);
//   }
// });

pnrdcRouter.post("/createDC", async (req, res, next) => {
  const { dcInvNo, unit, srlType, VoucherNoLength } = req.body;
  // console.log("VoucherNoLength", VoucherNoLength);

  const date = new Date();
  // const date = new Date("2024-04-01");
  const year = date.getFullYear();

  const getYear =
    date.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  const yearParts = getYear.split("-");
  const startYearShort = yearParts[0].slice(-2);
  const endYearShort = yearParts[1].slice(-2);
  const finYear = `${startYearShort}/${endYearShort}`;

  // console.log("finYear", finYear);

  try {
    // Fetch prefix from magod_setup.year_prefix_suffix
    const prefixQuery = `
    SELECT Prefix, Suffix FROM magod_setup.year_prefix_suffix WHERE SrlType='${srlType}' AND UnitName='${unit}';
    `;

    setupQueryMod(prefixQuery, async (prefixError, prefixResult) => {
      if (prefixError) {
        logger.error(prefixError);
        return next(prefixError);
      }

      const prefix =
        prefixResult[0]?.Prefix !== null ? prefixResult[0]?.Prefix : "";
      const suffix =
        prefixResult[0]?.Suffix !== null ? prefixResult[0]?.Suffix : "";

      // Fetch running number from magod_setup.magod_runningno
      const selectQuery = `
      SELECT * FROM magod_setup.magod_runningno WHERE SrlType='${srlType}' AND UnitName='${unit}' ORDER BY Id DESC LIMIT 1;
      `;

      setupQueryMod(selectQuery, async (selectError, selectResult) => {
        if (selectError) {
          logger.error(selectError);
          return next(selectError);
        }

        let newDCNo = "";

        if (selectResult && selectResult.length > 0) {
          const lastRunNo = selectResult[0].Running_No;
          const numericPart = parseInt(lastRunNo) + 1;
          const paddedNumericPart = numericPart
            .toString()
            .padStart(VoucherNoLength, "0");

          newDCNo = `${prefix}${paddedNumericPart}${suffix}`;
          // console.log("New DCNo:", newDCNo);

          // Update Running_No in magod_setup.magod_runningno
          const updateRunningNoQuery = `
            UPDATE magod_setup.magod_runningno
            SET Running_No = ${numericPart},
            Prefix = '${prefix}',
            Suffix = '${suffix}',
            Running_EffectiveDate = CurDate()
            WHERE SrlType='${srlType}' AND UnitName='${unit}' AND Period='${finYear}';
          `;

          setupQueryMod(updateRunningNoQuery, (updateError, updateResult) => {
            if (updateError) {
              logger.error(updateError);
              return next(updateError);
            }
          });
        }

        // Your existing update query
        misQueryMod(
          `UPDATE magodmis.draft_dc_inv_register
          SET DC_Date = curdate(),
          DC_No = '${newDCNo}',
          DC_Fin_Year='${finYear}',
          DCStatus = 'Despatched'
          WHERE DC_Inv_No = '${dcInvNo}'`,
          async (updateError, updateResult) => {
            if (updateError) {
              logger.error(updateError);
              return next(updateError);
            }
            logger.info(
              `successfully updated draft_dc_inv_register with DC_Inv_No='${dcInvNo}'`
            );

            // Your existing select query after update
            const postUpdateSelectQuery = `SELECT * FROM magodmis.draft_dc_inv_register WHERE DC_Inv_No = ${dcInvNo}`;
            misQueryMod(
              postUpdateSelectQuery,
              (postUpdateSelectError, postUpdateSelectResult) => {
                if (postUpdateSelectError) {
                  logger.error(postUpdateSelectError);
                  return next(postUpdateSelectError);
                }

                res.json(postUpdateSelectResult);
              }
            );
          }
        );
      });
    });
  } catch (error) {
    console.error("An error occurred:", error);
    next(error);
  }
});

pnrdcRouter.post("/receiveReturns", async (req, res, next) => {
  const { dcInvNo } = req.body;

  try {
    // Check if the record exists in material_receipt_register with Received status
    misQueryMod(
      `SELECT COUNT(*) AS count FROM magodmis.material_receipt_register m
       WHERE m.Ref_VrId = ${dcInvNo} AND m.RVStatus = 'Received'`,
      (err, data) => {
        // console.log("DATA", data);
        if (err) {
          logger.error(err);
          return next(err);
        }

        let RvId = 0;

        if (data[0].count === 0) {
          misQueryMod(
            `INSERT INTO magodmis.material_receipt_register (Cust_Code, Customer, Ref_VrId, Ref_VrNo, Type, CustGSTNo)
             SELECT d.Cust_Code, d.Cust_Name, d.DC_Inv_No, CONCAT(d.DC_No, ' dt ', DATE_FORMAT(d.DC_Date, '%d/%M/%y')) AS DCRef, 'ReturnableDC', d.GSTNo
             FROM magodmis.draft_dc_inv_register d WHERE d.DC_Inv_No = ${dcInvNo}`,
            (err, data) => {
              if (err) {
                logger.error(err);
                return next(err);
              }
              logger.info(
                `successfully inserted data into material_receipt_register`
              );

              // After the insert, retrieve the last inserted RvID
              misQueryMod("SELECT LAST_INSERT_ID() AS RvId", (err, data) => {
                if (err) {
                  logger.error(err);
                  return next(err);
                }

                console.log("Last Inserted RvId", data);

                RvId = data[0].RvId;

                // Insert into mtrl_returned_details using the obtained RvID
                misQueryMod(
                  `INSERT INTO magodmis.mtrl_returned_details (RvID, RV_SrlId, Part_Name, Part_Discription, DC_Qty, UOM, Qty_Received)
                     SELECT ${RvId}, d.Draft_dc_inv_DetailsID, d.Dwg_Code, d.Dwg_No, d.Qty, d.UOM, d.Qty - d.QtyReturned
                     FROM magodmis.draft_dc_inv_details d WHERE d.DC_Inv_No = ${dcInvNo}`,
                  (err, data) => {
                    if (err) {
                      logger.error(err);
                      return next(err);
                    }
                    logger.info(
                      `successfully inserted data into mtrl_returned_details`
                    );
                  }
                );
              });
            }
          );
        }

        // If the record exists, retrieve the existing RvID
        misQueryMod(
          `SELECT * FROM magodmis.material_receipt_register m
             WHERE m.Ref_VrId = ${dcInvNo} AND m.RVStatus = 'Received'`,
          (err, data) => {
            if (err) {
              logger.error(err);
              return next(err);
            }
            res.send(data);
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/firstTable", async (req, res, next) => {
  const { rvId } = req.body;
  try {
    misQueryMod(
      `select * from magodmis.mtrl_returned_details where RvID = '${rvId}'`,
      (err, data) => {
        if (err) logger.error(err);
        logger.info(`successfully fetched data from mtrl_returned_details`);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/secondTable", async (req, res, next) => {
  const { dcInvNo } = req.body;
  try {
    misQueryMod(
      `SELECT * FROM magodmis.draft_dc_inv_details WHERE DC_Inv_No=${dcInvNo}`,
      (err, data) => {
        if (err) logger.error(err);
        logger.info(`successfully fetched data from draft_dc_inv_details`);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/removeFirstTableData", async (req, res, next) => {
  try {
    const { ids, rvId } = req.body;

    const deleteResults = [];

    for (const id of ids) {
      if (id === undefined) {
        throw new Error("One or more IDs are not present.");
      }

      const deleteQuery = `
        DELETE FROM magodmis.mtrl_returned_details
        WHERE Id = ${id}
      `;

      misQueryMod(deleteQuery, (err, data) => {
        if (err) {
          logger.error(err);
          deleteResults.push({ id, error: "Delete failed." });
        } else {
          deleteResults.push({ id, success: true });
        }
      });
    }

    const selectQuery = `
      SELECT * FROM magodmis.mtrl_returned_details WHERE RvID = ${rvId};
    `;

    misQueryMod(selectQuery, (err, selectData) => {
      if (err) {
        logger.error(err);
        logger.info(
          `successfully fetched data from mtrl_returned_details with RvID=${rvId}`
        );
        return res
          .status(500)
          .json({ message: "Error executing SELECT query." });
      }
      // console.log("selectData", selectData);
      res.json(selectData);
    });
  } catch (error) {
    console.log("Error:", error.message);
    next(error);
  }
});

pnrdcRouter.post("/addToFirstTable", async (req, res, next) => {
  try {
    const { rowsToAdd, rvId } = req.body;

    const insertResults = [];
    let existingDraftIds = [];

    const selectQuery = `SELECT Rv_SrlId FROM magodmis.mtrl_returned_details WHERE RvID = ${rvId}`;
    misQueryMod(selectQuery, (selectErr, selectData) => {
      if (selectErr) {
        logger.error(selectErr);
        return res
          .status(500)
          .json({ message: "Error executing SELECT query." });
      }

      existingDraftIds = selectData.map((row) => row.Rv_SrlId);

      for (const row of rowsToAdd) {
        const { Draft_dc_inv_DetailsID } = row;

        if (Draft_dc_inv_DetailsID === undefined) {
          throw new Error("One or more IDs are not present.");
        }

        if (existingDraftIds.includes(Draft_dc_inv_DetailsID)) {
          insertResults.push({
            id: Draft_dc_inv_DetailsID,
            error: "Draft_dc_inv_DetailsID already exists in the firstTable.",
          });
        } else {
          const insertQuery = `
            INSERT INTO magodmis.mtrl_returned_details
            (RvID, RV_SrlId, Part_Name, Part_Discription, DC_Qty, UOM, Qty_Received)
            SELECT
              ${rvId},
              Draft_dc_inv_DetailsID,
              Dwg_Code,
              Dwg_No,
              Qty,
              UOM,
              Qty - QtyReturned
            FROM magodmis.draft_dc_inv_details 
            WHERE Draft_dc_inv_DetailsID = ${Draft_dc_inv_DetailsID};
          `;

          misQueryMod(insertQuery, (insertErr, insertData) => {
            if (insertErr) {
              logger.error(insertErr);
              insertResults.push({
                id: Draft_dc_inv_DetailsID,
                error: "Insert failed.",
              });
            } else {
              insertResults.push({
                id: Draft_dc_inv_DetailsID,
                success: true,
              });
            }
          });
        }
      }

      // Perform a final select query to get the updated data
      const finalSelectQuery = `SELECT * FROM magodmis.mtrl_returned_details WHERE RvID = ${rvId}`;
      misQueryMod(finalSelectQuery, (finalSelectErr, finalSelectData) => {
        if (finalSelectErr) {
          logger.error(finalSelectErr);
          logger.info(
            `successfully fetched data from mtrl_returned_details with RvID=${rvId}`
          );
          return res
            .status(500)
            .json({ message: "Error executing final SELECT query." });
        }
        res.json(finalSelectData);
      });
    });
  } catch (error) {
    console.log("Error:", error.message);
    next(error);
  }
});

pnrdcRouter.post("/saveJobWork", async (req, res, next) => {
  try {
    const {
      firstTable,
      rvId,
      CustDocuNo,
      CustGSTNo,
      RVStatus,
      UpDated,
      Type,
      Ref_VrId,
      Ref_VrNo,
      CancelReason,
    } = req.body;

    let SrlValue = 1;

    for (const val of firstTable) {
      val.Srl = SrlValue;
      SrlValue += 1;

      const updateQuery1 = `
        UPDATE magodmis.mtrl_returned_details SET RvID = ${val.RvID}, Rv_SrlId =${val.Rv_SrlId}, Srl =${val.Srl}, Part_Name ='${val.Part_Name}',
        Part_Discription='${val.Part_Discription}', DC_Qty =${val.DC_Qty}, 
        UOM ='${val.UOM}', Qty_Received =${val.Qty_Received}, Qty_Inspected =${val.Qty_Inspected}, Qty_Accepted =${val.Qty_Accepted}, Qty_Rejected=${val.Qty_Rejected}
        WHERE Id=${val.Id};
      `;

      misQueryMod(updateQuery1, (err, data) => {
        if (err) {
          logger.error(err);
          return next(err);
        }
        logger.info(
          `successfully updated data in mtrl_returned_details with Id=${val.Id}`
        );
      });
    }

    const updateQuery2 = `
      UPDATE magodmis.material_receipt_register SET
      CustDocuNo= '${CustDocuNo}',
      CustGSTNo= '${CustGSTNo}',
      RVStatus= '${RVStatus}',
      UpDated= ${UpDated},
      Type= '${Type}',
      Ref_VrId= ${Ref_VrId},
      Ref_VrNo= '${Ref_VrNo}',
      CancelReason= '${CancelReason}'
      WHERE RvID=${rvId};
    `;

    misQueryMod(updateQuery2, (err, data) => {
      if (err) {
        logger.error(err);
        return next(err);
      }
      logger.info(
        `successfully updated data in material_receipt_register with RvID=${rvId}`
      );

      const selectQuery1 = `
        SELECT * FROM magodmis.mtrl_returned_details WHERE RvID = ${rvId};
      `;

      const selectQuery2 = `
        SELECT * FROM magodmis.material_receipt_register WHERE RvID = ${rvId};
      `;

      misQueryMod(selectQuery1, (selectErr1, selectData1) => {
        if (selectErr1) {
          logger.error(selectErr1);
          return next(selectErr1);
        }

        misQueryMod(selectQuery2, (selectErr2, selectData2) => {
          if (selectErr2) {
            logger.error(selectErr2);
            return next(selectErr2);
          }

          res.json({
            firstTable: selectData1,
            materialReceiptRegister: selectData2,
          });
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/updateSrl", async (req, res, next) => {
  try {
    const { firstTable, rvId } = req.body;

    let SrlValue = 1;

    for (const val of firstTable) {
      val.Srl = SrlValue;
      SrlValue += 1;

      const updateQuery = `UPDATE magodmis.mtrl_returned_details SET Srl =${val.Srl} WHERE Id=${val.Id};`;

      misQueryMod(updateQuery, (err, data) => {
        if (err) {
          logger.error(err);
          console.log(err);
          return next(err);
        } else {
        }
      });
    }

    const selectQuery = `
    select * from magodmis.mtrl_returned_details WHERE RvID=${rvId};
    `;

    misQueryMod(selectQuery, (err, data) => {
      if (err) {
        logger.error(err);
      }
      res.send(data);
    });
  } catch (error) {
    next(error);
  }
});

// pnrdcRouter.post("/accept", async (req, res, next) => {
//   const { rvId, firstTable, dcInvNo, ewayBillNo, unit, srlType, prefix } =
//     req.body;

//   const date = new Date();
//   // const date = new Date("2024-04-01");
//   const year = date.getFullYear();
//   const startYear = date.getMonth() >= 3 ? year : year - 1;

//   const getYear =
//     date.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
//   const yearParts = getYear.split("-");
//   const yearShort = year.toString().slice(-2);
//   const startYearShort = yearParts[0].slice(-2);
//   const endYearShort = yearParts[1].slice(-2);
//   const finYear = `${startYearShort}/${endYearShort}`;

//   try {
//     const selectQuery = `
//     SELECT * FROM magod_setup.magod_runningno WHERE SrlType='${srlType}' AND UnitName='${unit}' ORDER BY Id DESC LIMIT 1`;

//     setupQueryMod(selectQuery, async (selectError, selectResult) => {
//       if (selectError) {
//         logger.error(selectError);
//         return next(selectResult);
//       }

//       let newRvNo = "";

//       if (selectResult && selectResult.length > 0) {
//         const lastRunNo = selectResult[0].Running_No;
//         console.log("lastRunNo", lastRunNo);
//         const numericPart = parseInt(lastRunNo) + 1;

//         const paddedNumericPart = numericPart.toString().padStart(4, "0");

//         newRvNo = `${yearShort}/${prefix}${paddedNumericPart}`;
//         console.log("New RvNo:", newRvNo);

//         // Update Running_No in magod_setup.magod_runningno
//         const updateRunningNoQuery = `
//           UPDATE magod_setup.magod_runningno
//           SET Running_No = ${numericPart}
//           WHERE SrlType='${srlType}' AND UnitName='${unit}' AND Period='${finYear}';
//         `;

//         setupQueryMod(updateRunningNoQuery, (updateError, updateResult) => {
//           if (updateError) {
//             logger.error(updateError);
//             return next(updateResult);
//           }
//         });
//       }

//       misQueryMod(
//         `UPDATE magodmis.material_receipt_register
//         SET RV_No='${newRvNo}', RV_Date=CURDATE(), RVStatus='Updated', EwayBillRef = '${ewayBillNo}'
//         WHERE RvID=${rvId}`,
//         async (updateError, updateResult) => {
//           if (updateError) {
//             logger.error(updateError);
//             return next(updateResult);
//           }

//           const postUpdateSelectQuery = `SELECT * FROM magodmis.material_receipt_register WHERE RvID = ${rvId}`;
//           misQueryMod(
//             postUpdateSelectQuery,
//             (postUpdateSelectError, postUpdateSelectResult) => {
//               if (postUpdateSelectError) {
//                 logger.error(postUpdateSelectError);
//                 return next(postUpdateSelectResult);
//               }

//               const updatedRVNo = postUpdateSelectResult[0].RV_No;
//               const updatedRvDate = postUpdateSelectResult[0].RV_Date;
//               const updatedRvStatus = postUpdateSelectResult[0].RVStatus;

//               // Update draft_dc_inv_details
//               for (const val of firstTable) {
//                 const updateQuery2 = `
//                   UPDATE magodmis.draft_dc_inv_details
//                   SET QtyReturned = (
//                     SELECT SUM(m.Qty_Received) as qtyReceived
//                     FROM magodmis.mtrl_returned_details m
//                     INNER JOIN magodmis.material_receipt_register m1 ON m1.RVId = m.RVId
//                     WHERE m.Rv_SrlId = ${val.Rv_SrlId} AND m1.RVStatus = 'Updated'
//                   )
//                   WHERE Draft_dc_inv_DetailsID = ${val.Rv_SrlId};
//                 `;

//                 misQueryMod(updateQuery2, (err, data) => {
//                   if (err) {
//                     logger.error(err);
//                     return next(err);
//                   }
//                 });
//               }

//               const updateQuery3 = `
//             UPDATE magodmis.draft_dc_inv_register d
//             SET d.DcStatus =
//               CASE
//                 WHEN (
//                   SELECT SUM(OpenSrlCount) as OpenSrlCount
//                   FROM (
//                     SELECT
//                       CASE WHEN GREATEST(CAST(d.Qty AS SIGNED) - CAST(d.QtyReturned AS SIGNED), 0) > 0 THEN 1 ELSE 0 END as OpenSrlCount
//                     FROM magodmis.draft_dc_inv_details d
//                     WHERE d.DC_Inv_No = ${dcInvNo}
//                   ) as b
//                 ) = 0 THEN 'Closed'
//                 ELSE 'Despatched'
//               END
//             WHERE d.DC_Inv_No = ${dcInvNo};

//             `;

//               misQueryMod(updateQuery3, (err, data) => {
//                 if (err) {
//                   logger.error(err);
//                   return next(err);
//                 }

//                 const selectQuery2 = `
//                 SELECT * FROM magodmis.draft_dc_inv_details WHERE DC_Inv_No = ${dcInvNo}
//               `;

//                 misQueryMod(selectQuery2, (err, draftDetailsData) => {
//                   if (err) {
//                     logger.error(err);
//                     return next(err);
//                   }

//                   const draft_dc_inv_details = draftDetailsData;

//                   // Select query for draft_dc_inv_register
//                   const selectQuery3 = `
//                   SELECT * FROM magodmis.draft_dc_inv_register WHERE DC_Inv_No = ${dcInvNo};
//                 `;

//                   misQueryMod(selectQuery3, (selectErr, draftRegisterData) => {
//                     if (selectErr) {
//                       logger.error(selectErr);
//                       return next(selectErr);
//                     }

//                     const draft_dc_inv_register = draftRegisterData;

//                     res.send({
//                       updatedRVNo,
//                       updatedRvDate,
//                       updatedRvStatus,
//                       draft_dc_inv_details,
//                       draft_dc_inv_register,
//                     });
//                   });
//                 });
//               });
//             }
//           );
//         }
//       );
//     });
//   } catch (error) {
//     next(error);
//   }
// });

pnrdcRouter.post("/accept", async (req, res, next) => {
  const {
    rvId,
    firstTable,
    dcInvNo,
    ewayBillNo,
    unit,
    srlType,
    VoucherNoLength,
  } = req.body;

  const date = new Date();
  const year = date.getFullYear();
  const startYear = date.getMonth() >= 3 ? year : year - 1;

  const getYear =
    date.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  const yearParts = getYear.split("-");
  const yearShort = year.toString().slice(-2);
  const startYearShort = yearParts[0].slice(-2);
  const endYearShort = yearParts[1].slice(-2);
  const finYear = `${startYearShort}/${endYearShort}`;

  try {
    const prefixQuery = `
    SELECT Prefix, Suffix FROM magod_setup.year_prefix_suffix WHERE SrlType='${srlType}' AND UnitName='${unit}';
    `;

    setupQueryMod(prefixQuery, async (prefixError, prefixResult) => {
      if (prefixError) {
        logger.error(prefixError);
        return next(prefixResult);
      }

      // const fetchedPrefix = prefixResult[0].Prefix;
      const fetchedPrefix =
        prefixResult[0]?.Prefix !== null ? prefixResult[0]?.Prefix : "";
      const fetchedSuffix =
        prefixResult[0]?.Suffix !== null ? prefixResult[0]?.Suffix : "";

      // console.log("Prefix Suffix", fetchedPrefix, fetchedSuffix);
      const selectQuery = `
      SELECT * FROM magod_setup.magod_runningno WHERE SrlType='${srlType}' AND UnitName='${unit}' ORDER BY Id DESC LIMIT 1`;

      setupQueryMod(selectQuery, async (selectError, selectResult) => {
        if (selectError) {
          logger.error(selectError);
          return next(selectResult);
        }

        let newRvNo = "";

        if (selectResult && selectResult.length > 0) {
          const lastRunNo = selectResult[0].Running_No;
          const numericPart = parseInt(lastRunNo) + 1;

          const paddedNumericPart = numericPart
            .toString()
            .padStart(VoucherNoLength, "0");

          newRvNo = `${yearShort}/${fetchedPrefix}${paddedNumericPart}${fetchedSuffix}`;

          const updateRunningNoQuery = `
            UPDATE magod_setup.magod_runningno
            SET Running_No = ${numericPart},
            Prefix = '${fetchedPrefix}',
            Suffix = '${fetchedSuffix}',
            Running_EffectiveDate = CurDate()
            WHERE SrlType='${srlType}' AND UnitName='${unit}' AND Period='${finYear}';
          `;

          setupQueryMod(updateRunningNoQuery, (updateError, updateResult) => {
            if (updateError) {
              logger.error(updateError);
              return next(updateResult);
            }
          });
        }

        misQueryMod(
          `UPDATE magodmis.material_receipt_register
          SET RV_No='${newRvNo}', RV_Date=CURDATE(), RVStatus='Updated', EwayBillRef = '${ewayBillNo}'
          WHERE RvID=${rvId}`,
          async (updateError, updateResult) => {
            if (updateError) {
              logger.error(updateError);
              return next(updateResult);
            }

            const postUpdateSelectQuery = `SELECT * FROM magodmis.material_receipt_register WHERE RvID = ${rvId}`;
            misQueryMod(
              postUpdateSelectQuery,
              (postUpdateSelectError, postUpdateSelectResult) => {
                if (postUpdateSelectError) {
                  logger.error(postUpdateSelectError);
                  return next(postUpdateSelectResult);
                }

                const updatedRVNo = postUpdateSelectResult[0].RV_No;
                const updatedRvDate = postUpdateSelectResult[0].RV_Date;
                const updatedRvStatus = postUpdateSelectResult[0].RVStatus;

                // Update draft_dc_inv_details
                for (const val of firstTable) {
                  const updateQuery2 = `
                  UPDATE magodmis.draft_dc_inv_details
                  SET QtyReturned = (
                    SELECT SUM(m.Qty_Received) as qtyReceived
                    FROM magodmis.mtrl_returned_details m
                    INNER JOIN magodmis.material_receipt_register m1 ON m1.RVId = m.RVId
                    WHERE m.Rv_SrlId = ${val.Rv_SrlId} AND m1.RVStatus = 'Updated'
                  )
                  WHERE Draft_dc_inv_DetailsID = ${val.Rv_SrlId};
                `;

                  misQueryMod(updateQuery2, (err, data) => {
                    if (err) {
                      logger.error(err);
                      return next(err);
                    }
                  });
                }

                const updateQuery3 = `
            UPDATE magodmis.draft_dc_inv_register d
            SET d.DcStatus =
              CASE
                WHEN (
                  SELECT SUM(OpenSrlCount) as OpenSrlCount
                  FROM (
                    SELECT
                      CASE WHEN GREATEST(CAST(d.Qty AS SIGNED) - CAST(d.QtyReturned AS SIGNED), 0) > 0 THEN 1 ELSE 0 END as OpenSrlCount
                    FROM magodmis.draft_dc_inv_details d
                    WHERE d.DC_Inv_No = ${dcInvNo}
                  ) as b
                ) = 0 THEN 'Closed'
                ELSE 'Despatched'
              END
            WHERE d.DC_Inv_No = ${dcInvNo};
            
            `;

                misQueryMod(updateQuery3, (err, data) => {
                  if (err) {
                    logger.error(err);
                    return next(err);
                  }

                  const selectQuery2 = `
                SELECT * FROM magodmis.draft_dc_inv_details WHERE DC_Inv_No = ${dcInvNo}
              `;

                  misQueryMod(selectQuery2, (err, draftDetailsData) => {
                    if (err) {
                      logger.error(err);
                      return next(err);
                    }

                    const draft_dc_inv_details = draftDetailsData;

                    // Select query for draft_dc_inv_register
                    const selectQuery3 = `
                  SELECT * FROM magodmis.draft_dc_inv_register WHERE DC_Inv_No = ${dcInvNo};
                `;

                    misQueryMod(
                      selectQuery3,
                      (selectErr, draftRegisterData) => {
                        if (selectErr) {
                          logger.error(selectErr);
                          return next(selectErr);
                        }

                        const draft_dc_inv_register = draftRegisterData;

                        res.send({
                          updatedRVNo,
                          updatedRvDate,
                          updatedRvStatus,
                          draft_dc_inv_details,
                          draft_dc_inv_register,
                        });
                      }
                    );
                  });
                });
              }
            );
          }
        );
      });
    });
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/receiveTable", async (req, res, next) => {
  const { rvId, Ref_VrId } = req.body;

  try {
    misQueryMod(
      `select * from magodmis.material_receipt_register where Ref_VrId = ${Ref_VrId}`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/cancel", async (req, res, next) => {
  const { rvId, firstTable, dcInvNo, CancelReason } = req.body;

  try {
    // Update material_receipt_register
    misQueryMod(
      `UPDATE magodmis.material_receipt_register
        SET RVStatus='Cancelled',
        CancelReason = '${CancelReason}'
        WHERE RvID=${rvId}`,
      async (updateError, updateResult) => {
        if (updateError) {
          logger.error(updateError);
          return next(updateResult);
        }

        // Your existing select query after update
        const postUpdateSelectQuery = `SELECT * FROM magodmis.material_receipt_register WHERE RvID = ${rvId}`;
        misQueryMod(
          postUpdateSelectQuery,
          async (postUpdateSelectError, postUpdateSelectResult) => {
            if (postUpdateSelectError) {
              logger.error(postUpdateSelectError);
              return next(postUpdateSelectResult);
            }

            const updatedRVNo = postUpdateSelectResult[0].RV_No;
            const updatedRvDate = postUpdateSelectResult[0].RV_Date;
            const updateRvStatus = postUpdateSelectResult[0].RVStatus;

            // Update draft_dc_inv_details
            for (const val of firstTable) {
              const updateQuery2 = `
              UPDATE magodmis.draft_dc_inv_details 
              SET QtyReturned = COALESCE(
                (
                  SELECT SUM(m.Qty_Received) as qtyReceived 
                  FROM magodmis.mtrl_returned_details m, magodmis.material_receipt_register m1
                  WHERE m.Rv_SrlId=${val.Rv_SrlId} AND m1.RVId=m.RVId AND m1.RVStatus='Updated'
                ),
                0  
              )
              WHERE Draft_dc_inv_DetailsID=${val.Rv_SrlId};
              
              `;

              misQueryMod(updateQuery2, (err, data) => {
                if (err) {
                  logger.error(err);
                  console.log("data", data);
                  return next(err);
                }
              });
            }

            // Update draft_dc_inv_register
            const updateQuery3 = `
              UPDATE magodmis.draft_dc_inv_register d,
              (SELECT SUM(OpenSrlCount) as OpenSrlCount FROM
                (SELECT CASE WHEN d.qty-d.QtyReturned>0 THEN 1 ELSE 0 END as OpenSrlCount
                FROM magodmis.draft_dc_inv_details d
                WHERE d.DC_Inv_No=${dcInvNo}) as b) as A
              SET d.DcStatus=CASE WHEN a.OpenSrlCount=0 THEN 'Closed' ELSE 'Despatched' END
              WHERE d.DC_Inv_No=${dcInvNo};
            `;

            misQueryMod(updateQuery3, (err, data) => {
              if (err) {
                logger.error(err);
                return next(err);
              }

              const selectQuery2 = `
                SELECT * FROM magodmis.draft_dc_inv_details WHERE DC_Inv_No = ${dcInvNo}
              `;

              misQueryMod(selectQuery2, (err, draftDetailsData) => {
                if (err) {
                  logger.error(err);
                  return next(err);
                }

                const draft_dc_inv_details = draftDetailsData;

                // Select query for draft_dc_inv_register
                const selectQuery3 = `
                  SELECT * FROM magodmis.draft_dc_inv_register WHERE DC_Inv_No = ${dcInvNo};
                `;

                misQueryMod(selectQuery3, (selectErr, draftRegisterData) => {
                  if (selectErr) {
                    logger.error(selectErr);
                    return next(selectErr);
                  }

                  const draft_dc_inv_register = draftRegisterData;

                  // Send the response once all queries are complete
                  res.send({
                    updatedRVNo,
                    updatedRvDate,
                    updateRvStatus,
                    draft_dc_inv_details,
                    draft_dc_inv_register,
                  });
                });
              });
            });
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/dcCancel", async (req, res, next) => {
  try {
    const { dcInvNo, dcCancel } = req.body;

    const updateQuery = `UPDATE magodmis.draft_dc_inv_register SET DCStatus = 'Cancelled', 
    DC_CancelReason = '${dcCancel}'
    WHERE DC_Inv_No=${dcInvNo}`;

    misQueryMod(updateQuery, (err, data) => {
      if (err) {
        logger.error(err);
        return next(err);
      } else {
      }
    });

    const selectQuery = `
    select * from magodmis.draft_dc_inv_register WHERE DC_Inv_No=${dcInvNo}
    `;

    misQueryMod(selectQuery, (err, data) => {
      if (err) {
        logger.error(err);
      }
      res.send(data);
    });
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.get("/dcDraft", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT * FROM magodmis.draft_dc_inv_register where DC_InvType = 'ReturnableDC' and IsDC = 1 and DCStatus = 'Draft'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.get("/dcDespatched", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT * FROM magodmis.draft_dc_inv_register where DC_InvType = 'ReturnableDC' and IsDC = 1 and DCStatus = 'Despatched'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.get("/dcClosed", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT * FROM magodmis.draft_dc_inv_register where DC_InvType = 'ReturnableDC' and IsDC = 1 and DCStatus = 'Closed'`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.get("/dcAll", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT * 
      FROM magodmis.draft_dc_inv_register 
      WHERE DC_InvType = 'ReturnableDC' 
        AND IsDC = 1 
        AND (DCStatus = 'Despatched' OR DCStatus = 'Closed');`,
      (err, data) => {
        if (err) logger.error(err);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/allCreateNewData", async (req, res, next) => {
  const { dcInvNo, Del_StateId } = req.body;
  // console.log("Del_StateId", req.body.Del_StateId);

  try {
    misQueryMod(
      `SELECT * FROM magodmis.draft_dc_inv_details WHERE DC_Inv_no = ${dcInvNo}`,
      (err, draft_dc_inv_details) => {
        if (err) {
          logger.error(err);
          return next(err);
        }

        misQueryMod(
          `SELECT * FROM magodmis.material_receipt_register WHERE Ref_VrId = ${dcInvNo}`,
          (err, material_receipt_register) => {
            if (err) {
              logger.error(err);
              return next(err);
            }

            misQueryMod(
              `SELECT * FROM magodmis.dc_inv_taxtable WHERE DC_Inv_no = '${dcInvNo}'`,
              (err, dc_inv_taxtable) => {
                if (err) {
                  logger.error(err);
                  return next(err);
                }

                setupQueryMod(
                  `SELECT State FROM magod_setup.state_codelist WHERE StateCode='${Del_StateId}';`,
                  (err, state_codelist) => {
                    if (err) {
                      logger.error(err);
                      return next(err);
                    }

                    misQueryMod(
                      `select * from magodmis.draft_dc_inv_register where DC_Inv_No = ${dcInvNo}`,
                      (err, draft_dc_inv_register) => {
                        if (err) {
                          logger.error(err);
                          return next(err);
                        }

                        // Combine results into an object
                        const responseData = {
                          draft_dc_inv_details,
                          material_receipt_register,
                          dc_inv_taxtable,
                          state_codelist,
                          draft_dc_inv_register,
                        };

                        // Send the combined results as the response
                        // console.log("responseData", responseData);
                        res.send(responseData);
                      }
                    );
                  }
                );
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

// pnrdcRouter.post("/insertRunNoRow", async (req, res, next) => {
//   const { unit, srlType, ResetPeriod, ResetValue, VoucherNoLength, prefix } =
//     req.body;

//   const unitName = `${unit}`;
//   const date = new Date();
//   // const date = new Date("2024-04-01");
//   const year = date.getFullYear();
//   const startYear = date.getMonth() >= 3 ? year : year - 1;
//   const endYear = startYear + 1;

//   const firstLetter = unitName.charAt(0).toUpperCase();
//   const financialYearStartDate = new Date(`${startYear}-04-01`);
//   const financialYearEndDate = new Date(`${endYear}-04-01`);

//   const formattedStartDate = financialYearStartDate.toISOString().slice(0, 10);
//   const formattedEndDate = financialYearEndDate.toISOString().slice(0, 10);

//   const getYear =
//     date.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
//   const yearParts = getYear.split("-");
//   const startYearShort = yearParts[0].slice(-2);
//   const endYearShort = yearParts[1].slice(-2);
//   const finYear = `${startYearShort}/${endYearShort}`;

//   console.log("finYear", finYear);

//   try {
//     const selectQuery = `
//     SELECT COUNT(Id) FROM magod_setup.magod_runningno  WHERE SrlType='${srlType}'
//     AND UnitName='${unit}' AND Period='${finYear}'
//     `;

//     setupQueryMod(selectQuery, (selectError, selectResult) => {
//       if (selectError) {
//         logger.error(selectError);
//         return next(selectResult);
//       }

//       const count = selectResult[0]["COUNT(Id)"];

//       if (count === 0) {
//         // If count is 0, execute the INSERT query
//         const insertQuery = `
//           INSERT INTO magod_setup.magod_runningno
//           (UnitName, SrlType, ResetPeriod, ResetValue, EffectiveFrom_date, Reset_date, Running_No, Prefix, Length, Period, Running_EffectiveDate)
//           VALUES ('${unit}', '${srlType}', '${ResetPeriod}', ${ResetValue}, '${formattedStartDate}', '${formattedEndDate}',${ResetValue}, '${prefix}', ${VoucherNoLength}, '${finYear}', CurDate());
//         `;

//         // Execute the INSERT query
//         setupQueryMod(insertQuery, (insertError, insertResult) => {
//           if (insertError) {
//             logger.error(insertError);
//             return next(insertResult);
//           }

//           res.json({ message: "Record inserted successfully." });
//         });
//       } else {
//         res.json({ message: "Record already exists." });
//       }
//     });
//   } catch (error) {
//     console.error("An error occurred:", error);
//     next(error);
//   }
// });

pnrdcRouter.post("/insertRunNoRow", async (req, res, next) => {
  const { unit, srlType, ResetPeriod, ResetValue, VoucherNoLength } = req.body;

  const unitName = `${unit}`;
  const date = new Date();
  // const date = new Date("2024-04-01");
  const year = date.getFullYear();
  const startYear = date.getMonth() >= 3 ? year : year - 1;
  const endYear = startYear + 1;

  const firstLetter = unitName.charAt(0).toUpperCase();
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
        const selectPrefixQuery = `
        SELECT * FROM magod_setup.year_prefix_suffix WHERE SrlType='${srlType}'
        AND UnitName='${unit}'
        `;

        setupQueryMod(selectPrefixQuery, (prefixError, prefixResult) => {
          if (prefixError) {
            logger.error(prefixError);
            return next(prefixError);
          }

          const prefix =
            prefixResult[0]?.Prefix !== null ? prefixResult[0]?.Prefix : "";
          const suffix =
            prefixResult[0]?.Suffix !== null ? prefixResult[0]?.Suffix : "";

          console.log("Prefix Suffix", prefix, suffix);

          const insertQuery = `
            INSERT INTO magod_setup.magod_runningno
            (UnitName, SrlType, ResetPeriod, ResetValue, EffectiveFrom_date, Reset_date, Running_No, Prefix, Suffix, Length, Period, Running_EffectiveDate)
            VALUES ('${unit}', '${srlType}', '${ResetPeriod}', ${ResetValue}, '${formattedStartDate}', '${formattedEndDate}',${ResetValue}, '${prefix}', '${suffix}', ${VoucherNoLength}, '${finYear}', CurDate());
          `;

          setupQueryMod(insertQuery, (insertError, insertResult) => {
            if (insertError) {
              logger.error(insertError);
              return next(insertResult);
            }

            res.json({ message: "Record inserted successfully." });
          });
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

pnrdcRouter.post("/customerCount", async (req, res, next) => {
  const { custCode } = req.body;
  try {
    misQueryMod(
      `SELECT COUNT(*) AS CustomerCount
      FROM magodmis.draft_dc_inv_register
      WHERE DC_InvType = 'ReturnableDC' AND IsDC = 1 AND DCStatus = 'Draft' AND Cust_Code = '${custCode}'
      GROUP BY Cust_Name;
      `,
      (err, data) => {
        if (err) logger.error(err);
        // console.log("data", data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.post("/updateCount", async (req, res, next) => {
  const { dcInvNo } = req.body;
  try {
    misQueryMod(
      `SELECT COUNT(CASE WHEN RVStatus = 'Updated' THEN 1 END) AS UpdatedCount
      FROM magodmis.material_receipt_register m
      WHERE m.Ref_VrId = ${dcInvNo};
      `,
      (err, data) => {
        if (err) logger.error(err);
        // console.log("data", data);

        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

pnrdcRouter.get("/getPDFData", async (req, res, next) => {
  try {
    setupQueryMod(
      `SELECT * FROM magod_setup.magodlaser_units`,
      (err, pdfData) => {
        if (err) {
          console.log("err", err);
        } else {
          //   console.log("pdfData", pdfData);
          logger.info("successfully fetched data from magodlaser_units");

          res.send(pdfData);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = pnrdcRouter;
