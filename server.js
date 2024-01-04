const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
// const fileUpload = require('express-fileupload');

const app = express();

const userRouter = require("./routes/user");

const unitRouter = require("./routes/units");
const quoteRouter = require("./routes/quotations");
const customerRouter = require("./routes/customer");
const employeeRouter = require("./routes/employee");
const materialRouter = require("./routes/material");
const processlistRouter = require("./routes/processlist");
const termsconditionsRouter = require("./routes/termsconditions");
const tolerancetypeRouter = require("./routes/tolerancetype");
const inspectionRouter = require("./routes/inspection");
const packinglevelsRouter = require("./routes/packinglevels");
const mtrlgradesRouter = require("./routes/materialgrade");
const taxdbRouter = require("./routes/taxdetails");
const statesRouter = require("./routes/states");
const credittermsRouter = require("./routes/creditterms");
const mtrlsourceRouter = require("./routes/mtrlsource");
const salesexeclistRouter = require("./routes/salesexecutives");
const checkdrawingsRouter = require("./routes/checkdrawings");
const mailRouter = require("./routes/mailer");
const ordersRouter = require("./routes/orders");
const sigmancRouter = require("./routes/sigmanc");
const machineRouter = require("./routes/machines");
const productionRouter = require("./routes/production");
const stocksRouter = require("./routes/stocks");
const packinvRouter = require("./routes/packinv");
const analysisRouter = require("./routes/analysis");
const accountsRouter = require("./routes/accounts");
const fileRouter = require("./routes/files");
const { logger } = require("./helpers/logger");

//PAKINGINVOICE
const customerdataRouter = require("./routes/PackAndInv/CustomerData");
const pnProfileRouter = require("./routes/PackAndInv/PNProfile");
const pnrdcRouter = require("./routes/PackAndInv/ReturnableDC");
const InvoiceRouter = require("./routes/PackAndInv/Invoice");
const inspectionProfileRouter = require("./routes/PackAndInv/InspectionProfile");

// All Routes --------------------
app.use(cors());
app.use(bodyParser.json());
// app.use(fileUpload());
app.use("/user", userRouter);

app.use("/units", unitRouter);
app.use("/quotation", quoteRouter);
app.use("/customers", customerRouter);
app.use("/employees", employeeRouter);
app.use("/materials", materialRouter);
app.use("/processlists", processlistRouter);
app.use("/termsconditions", termsconditionsRouter);
app.use("/tolerancetypes", tolerancetypeRouter);
app.use("/inspectionlevels", inspectionRouter);
app.use("/packinglevels", packinglevelsRouter);
app.use("/mtrlgrades", mtrlgradesRouter);
app.use("/taxdetails", taxdbRouter);
app.use("/states", statesRouter);
app.use("/creditterms", credittermsRouter);
app.use("/mtrlsources", mtrlsourceRouter);
app.use("/salesexecutives", salesexeclistRouter);
app.use("/mailer", mailRouter);
app.use("/checkdrawings", checkdrawingsRouter);
app.use("/order", ordersRouter);
app.use("/sigmanc", sigmancRouter);
app.use("/machine", machineRouter);
app.use("/production", productionRouter);
app.use("/stocks", stocksRouter);
app.use("/packinv", packinvRouter);
app.use("/analysis", analysisRouter);
app.use("/accounts", accountsRouter);
app.use("/file", fileRouter);
//PAKINGINVOICE Inspection
app.use("/customerdata", customerdataRouter);
app.use("/pnprofile", pnProfileRouter);
app.use("/pnrDC", pnrdcRouter);
app.use("/invoice", InvoiceRouter);
app.use("/inspection", inspectionProfileRouter);

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
  logger.error(`Status Code : ${err.status}  - Error : ${err.message}`);
});

// starting the server
app.listen(3001, () => {
  console.log("listening on port 3001");
  logger.info("listening on port 3001");
});
