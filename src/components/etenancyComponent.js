//package
const nconf = require("nconf");
const { PDFDocument, StandardFonts, TextAlignment } = require("pdf-lib");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

// model
const etenancyModel = require("../models/etanancyModel");

//lib
const db = require("../libs/db");
const lib = require("../libs/lib");

//variable
const pagingConfig = nconf.get("paging");

exports.create = async (form) => {
  console.log("create agreementData");
  console.log(form);

  const newEtenancy = new etenancyModel({
    _id: db.newId(),
    property: {
      address: form.propertyAddress,
      monthlyRental: form.monthlyRental,
    },
    tenant: {
      name: form.tenantName1,
      email: form.tenantEmail1,
      mobile: form.tenantMobile1,
      identity: {
        number: form.tenantIdentityNo1,
        type: form.tenantIdentityType1,
      },
    },
    tenancy: {
      period: form.tenancyPeriod,
      startDate: form.tenancyStartDate,
      endDate: form.tenancyEndDate,
    },
    deposit: {
      security: form.securityDeposit,
      utility: form.utilityDeposit,
      accessCard: form.accessCardDeposit,
      parkingCard: form.parkingCardDeposit,
    },
    dateOfAgreement: form.dateOfAgreement,
    status: "New",
  });

  try {
    const result = await newEtenancy.save();
    return result;
  } catch (err) {
    throw err;
  }
};

exports.edit = async (form) => {
  console.log("edit agreementData");
  console.log(form);

  const update = {
    property: {
      address: form.propertyAddress,
      monthlyRental: form.monthlyRental,
    },
    tenant: {
      name: form.tenantName1,
      email: form.tenantEmail1,
      mobile: form.tenantMobile1,
      identity: {
        number: form.tenantIdentityNo1,
        type: form.tenantIdentityType1,
      },
    },
    tenancy: {
      period: form.tenancyPeriod,
      startDate: form.tenancyStartDate,
      endDate: form.tenancyEndDate,
    },
    deposit: {
      security: form.securityDeposit,
      utility: form.utilityDeposit,
      accessCard: form.accessCardDeposit,
      parkingCard: form.parkingCardDeposit,
    },
  };

  try {
    const result = await etenancyModel.findByIdAndUpdate(
      form._id,
      update,
      db.updateOption
    );
    return result;
  } catch (err) {
    throw err;
  }
};

const searchCount = async (pipeline) => {
  const count = {
    $count: "records",
  };

  pipeline.push(count);

  let summary = {
    records: 0,
    pages: 0,
  };

  //console.log(pipeline);
  try {
    const result = await etenancyModel.aggregate(pipeline);
    // console.log('count..');
    // console.log(result);
    if (result.length > 0) {
      summary.records = result[0].records;
      summary.pages = Math.floor(summary.records / pagingConfig.limit);
      if (summary.records % pagingConfig.limit > 0) summary.pages++;
    }
    return summary;
  } catch (err) {
    throw err;
  }
};

const searchOnly = async (pipeline, paging) => {
  let skip,
    limit = { $limit: pagingConfig.limit };
  const sort = {
    $sort: {
      created: -1,
    },
  };

  if (paging) {
    if (paging.page) {
      if (!isNaN(paging.page) && paging.page > 0) {
        skip = { $skip: (paging.page - 1) * pagingConfig.limit };
      }
    }
  }
  pipeline.push(sort);
  if (skip) pipeline.push(skip);
  pipeline.push(limit);

  // console.log(pipeline);
  try {
    const result = await etenancyModel.aggregate(pipeline);
    //console.log('data.');
    //console.log(result);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.search = async (search, paging) => {
  let pipeline = [];
  let match = {};

  if (search.status) {
    match.status = search.status;
  }

  if (search.custom) {
    match.$or = [
      {
        "tenant.name": new RegExp(search.custom, "i"),
      },
      {
        "tenant.email": new RegExp(search.custom, "i"),
      },
      {
        "tenant.mobile": new RegExp(search.custom, "i"),
      },
      {
        "property.address": new RegExp(search.custom, "i"),
      },
    ];
  }

  const matchStage = {
    $match: match,
  };

  pipeline = db.formPipeline(matchStage);

  try {
    let searchSummary;

    if (!paging || !paging.page || paging.page === 1) {
      const pipelineCount = [...pipeline];
      searchSummary = await searchCount(pipelineCount);
    }

    const pipelineData = [...pipeline];
    const searchData = await searchOnly(pipelineData, paging);

    let result = {
      data: searchData,
      summary: {},
    };

    if (searchSummary) result.summary = searchSummary;
    return result;
  } catch (err) {
    throw err;
  }
};

const getById = async (etenacyId) => {
  try {
    const result = await etenancyModel.findById(etenacyId);
    return result;
  } catch (err) {
    throw err;
  }
};
exports.getById = getById;

const specialFormatting = (fieldName, value, pdfType = "") => {
  if (fieldName === "tenantIdentityNo1[0]") return `NRIC : ${value}`;
  if (fieldName === "securityDeposit" && pdfType === "Tenancy") {
    if (parseInt(value) === 0) return `Zero Deposit (RM ${value}) only`;
    else return `Ringgit Malaysia (RM ${value}) only`;
  }
  return String(`${value ?? ""}`);
};

const setText = (
  agreement,
  form,
  fieldName,
  assignToField = null,
  alignCenter = false,
  fontFamily,
  pdfType
) => {
  let textField;
  // console.log(agreement.tenancyPeriod)
  // console.log(agreement.tenancyOtherPeriod)
  // console.log(fieldName)

  try {
    if (assignToField) textField = form.getTextField(assignToField);
    else textField = form.getTextField(fieldName);
    const value = agreement[fieldName];
    // console.log(textField)
    // console.log(value)
    if (value && textField) {
      if (fieldName === "tenancyPeriod" && agreement.tenancyPeriod === "Other")
        textField.setText(agreement.tenancyOtherPeriod);
      textField.setText(
        specialFormatting(assignToField ?? fieldName, value, pdfType)
      );
      if (alignCenter) textField.setAlignment(TextAlignment.Center);
      if (fontFamily) textField.updateAppearances(fontFamily);
    }
  } catch (err) {
    // console.log(err);
    throw err;
  }
};

// const selectRadioInput = (
//   tenancyAgreement,
//   form,
//   fieldName,
//   assignToField = null
// ) => {
//   let radioGroup;

//   try {
//     if (assignToField) radioGroup = form.getRadioGroup(assignToField);
//     else radioGroup = form.getRadioGroup(fieldName);
//     const value = tenancyAgreement[fieldName];
//     if (value && radioGroup) radioGroup.select(value);
//   } catch (err) {
//     // console.log(err);
//     throw err;
//   }
// };

const setSignature = async (
  pdfDoc,
  tenancyAgreement,
  form,
  fieldName,
  assignToField = null
) => {
  let signatureField;
  if (assignToField) signatureField = form.getButton(assignToField);
  else signatureField = form.getButton(fieldName);
  const signature = tenancyAgreement[fieldName];
  if (signatureField && signature)
    signatureField.setImage(await pdfDoc.embedPng(signature));
};

const nthDate = (day) => {
  let selector;
  if (day <= 0) {
    selector = 4;
  } else if ((day > 3 && day < 21) || day % 10 > 3) {
    selector = 0;
  } else {
    selector = day % 10;
  }
  return day + ["th", "st", "nd", "rd", ""][selector];
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const monthNameFormat = (date) => {
  // console.log(date)
  let dateValue = new Date(date);
  // console.log(dateValue)
  return (
    nthDate(dateValue.getDate()) +
    " " +
    monthNames[dateValue.getMonth()] +
    " " +
    dateValue.getFullYear()
  );
};

// const formatDateDMY = (date) => {
//   let dateValue = new Date(date);
//   let formatDate = moment(dateValue).format("DD/MM/YY");
//   return formatDate;
// };

const timezoneConvert = (date) => {
  const newDate = new Date(date).toLocaleString("en-Us", {
    timeZone: "Asia/Kuala_Lumpur",
  });
  return newDate;
};

const setDate = (
  tenancyAgreement,
  form,
  fieldName,
  assignToField = null,
  dateFormatFunc,
  alignCenter,
  fontFamily
) => {
  let dateField;
  if (assignToField) dateField = form.getTextField(assignToField);
  else dateField = form.getTextField(fieldName);

  const date = tenancyAgreement[fieldName];
  if (dateField && date) {
    // dateField.setText(new Date(date).toDateString());
    const slashDate = dateFormatFunc(date);
    if (fieldName === "tenantPaidDate")
      dateField.setText(
        specialFormatting(assignToField ?? fieldName, slashDate)
      );
    else dateField.setText(slashDate);
    if (alignCenter) dateField.setAlignment(TextAlignment.Center);
    if (fontFamily) dateField.updateAppearances(fontFamily);
  }
};

async function fetchLocalPDF(pdfPath) {
  // Read the PDF file as a buffer
  const pdfBuffer = await fs.promises.readFile(pdfPath);
  // console.log(pdfBuffer)
  // Convert the buffer to an ArrayBuffer
  const pdfBytes = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength
  );
  // console.log(pdfBytes)
  return pdfBytes;
}

const mailMergeAgreement = async (form) => {
  let agreement = form;
  //   console.log(tenancyAgreement);
  const pdfPath = path.join(__dirname, "../../public", "Tenancy_Agreement.pdf");
  const pdfBytes = await fetchLocalPDF(pdfPath);
  // console.log("pdfBytes)
  // console.log(pdfBytes)
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanFontBold = await pdfDoc.embedFont(
    StandardFonts.TimesRomanBold
  );

  const pdfForm = pdfDoc.getForm();

  const fields = pdfForm.getFields();
  fields.forEach((field) => {
    const type = field.constructor.name;
    const name = field.getName();
    console.log(`${name}`);
  });
  // console.log("Line 206")
  // console.log(tenancyAgreement)

  //Page 1
  setDate(
    agreement,
    pdfForm,
    "dateOfAgreement",
    "dateOfAgreement[0]",
    monthNameFormat,
    true,
    timesRomanFont
  );
  if (agreement.tenantName1.length < 20) {
    setText(
      agreement,
      pdfForm,
      "tenantName1",
      "tenantName1Short[0]",
      true,
      timesRomanFontBold
    );
    setText(
      agreement,
      pdfForm,
      "tenantName1",
      "tenantName1Short",
      false,
      timesRomanFont
    );
  } else {
    setText(
      agreement,
      pdfForm,
      "tenantName1",
      "tenantName1[0]",
      true,
      timesRomanFontBold
    );
    setText(agreement, pdfForm, "tenantName1", null, false, timesRomanFont);
  }

  setText(
    agreement,
    pdfForm,
    "tenantIdentityNo1",
    "tenantIdentityNo1[0]",
    true,
    timesRomanFontBold
  );
  setDate(
    agreement,
    pdfForm,
    "dateOfAgreement",
    null,
    monthNameFormat,
    false,
    timesRomanFont
  );

  setText(agreement, pdfForm, "tenantIdentityNo1", null, false, timesRomanFont);

  //Page 15
  setText(agreement, pdfForm, "propertyAddress", null, false, timesRomanFont);
  setText(agreement, pdfForm, "tenantMobile1", null, false, timesRomanFont);
  setText(agreement, pdfForm, "tenantEmail1", null, false, timesRomanFont);

  //Page 16
  setText(agreement, pdfForm, "tenancyPeriod", null, false, timesRomanFont);
  setDate(
    agreement,
    pdfForm,
    "tenancyStartDate",
    null,
    monthNameFormat,
    false,
    timesRomanFont
  );
  setDate(
    agreement,
    pdfForm,
    "tenancyEndDate",
    null,
    monthNameFormat,
    false,
    timesRomanFont
  );
  setText(
    agreement,
    pdfForm,
    "basicMonthlyRental",
    null,
    false,
    timesRomanFont
  );
  setText(agreement, pdfForm, "tenantPaidAmount", null, false, timesRomanFont);

  setText(
    agreement,
    pdfForm,
    "securityDeposit",
    null,
    false,
    timesRomanFont,
    "Tenancy"
  );
  // console.log(agreement.securityDeposit)
  if (parseInt(agreement.securityDeposit) === 0) {
    agreement.securityDepositRule = "need compensate one month rental";
  } else {
    agreement.securityDepositRule = "will forfeit half month rental deposit";
  }
  setText(
    agreement,
    pdfForm,
    "securityDepositRule",
    null,
    false,
    timesRomanFontBold
  );

  setText(agreement, pdfForm, "utilityDeposit", null, false, timesRomanFont);
  setText(agreement, pdfForm, "accessCardDeposit", null, false, timesRomanFont);
  setText(
    agreement,
    pdfForm,
    "parkingCardDeposit",
    null,
    false,
    timesRomanFont
  );

  //Page 21
  setText(agreement, pdfForm, "hostName", null, false, timesRomanFont);
  setDate(
    agreement,
    pdfForm,
    "hostSignDate",
    null,
    monthNameFormat,
    false,
    timesRomanFont
  );
  setDate(
    agreement,
    pdfForm,
    "hostIdentityNo",
    null,
    false,
    timesRomanFont
  );
  setDate(
    agreement,
    pdfForm,
    "tenantSignDate1",
    null,
    monthNameFormat,
    false,
    timesRomanFont
  );
  await setSignature(pdfDoc, agreement, pdfForm, "hostSignatureImage");
  await setSignature(
    pdfDoc,
    agreement,
    pdfForm,
    "tenantSignatureImage",
    "tenantSignatureImage1"
  );

  pdfForm.flatten();
  const result = await pdfDoc.save();
  //   console.log(result);
  return result;
};

exports.previewAgreement = async (form) => {
  if (form) {
    let agreement = {
      ...form,
      dateOfAgreement: timezoneConvert(form.dateOfAgreement),
      hostSignDate: timezoneConvert(form.hostSignDate),
      tenantSignDate1: timezoneConvert(form.tenantSignDate1),
      tenancyStartDate: timezoneConvert(form.tenancyStartDate),
      tenancyEndDate: timezoneConvert(form.tenancyEndDate),
    };

    const pdfAgreement = await mailMergeAgreement(agreement);
    return {
      ok: true,
      pdfAgreement,
    };
  }
};

exports.signAgreement = async (etenancyId, hostName, hostSignature) => {
  const etenancyFound = await getById(etenancyId);
  if (etenancyFound) {
    console.log(etenancyFound);
    const update = {
      "host.name": hostName,
      "host.signatureImage": hostSignature,
      "host.signDate": new Date(),
    };
    console.log(update);
    const result = await etenancyModel.findByIdAndUpdate(
      etenancyFound._id,
      update,
      db.updateOption
    );
    console.log(result);
    return result;
  }
};
