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
      name: form.tenantName,
      email: form.tenantEmail,
      mobile: form.tenantMobile,
      identityNo: form.tenantIdentityNo,
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
      name: form.tenantName,
      email: form.tenantEmail,
      mobile: form.tenantMobile,
      identityNo: form.tenantIdentityNo,
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

const specialFormatting = (fieldName, value) => {
  if (fieldName === "hostIdentityNo[0]" || fieldName === "tenantIdentityNo[0]") return `NRIC : ${value}`;
  if (fieldName === "securityDeposit") {
    if (parseInt(value) === 0) return `Zero Deposit (RM ${value}) only`;
    else return `Ringgit Malaysia (RM ${value}) only`;
  }
  return String(`${value ?? ""}`);
};

const monthNameFormat = (date) => {
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

  // console.log(date)
  let dateValue = new Date(date);
  // console.log(dateValue)
  return (nthDate(dateValue.getDate()) + " " +monthNames[dateValue.getMonth()] + " " + dateValue.getFullYear());
};

const timezoneConvert = (date) => {
  const newDate = new Date(date).toLocaleString("en-Us", {
    timeZone: "Asia/Kuala_Lumpur",
  });
  return newDate;
};

const setText = (agreement, form, fieldName, assignToField = null, alignCenter = false, fontFamily) => {
  let textField;
  try {
      if (assignToField) textField = form.getTextField(assignToField);
      else textField = form.getTextField(fieldName);
      const value = agreement[fieldName];
      // console.log(textField)
      // console.log(value)
      if (value && textField) {          
          textField.setText(specialFormatting(assignToField ?? fieldName, value));
          if (alignCenter) textField.setAlignment(TextAlignment.Center);
          if (fontFamily) textField.updateAppearances(fontFamily);
      }
  } catch (err) {    
      throw err
  }
};

const setDate = (agreement, form, fieldName, assignToField = null, alignCenter, fontFamily) => {
  let dateField
  if (assignToField) dateField = form.getTextField(assignToField);
  else dateField = form.getTextField(fieldName);

  const date = agreement[fieldName];
  if (dateField && date) {    
      dateField.setText(monthNameFormat(date));
      if (alignCenter) dateField.setAlignment(TextAlignment.Center);
      if (fontFamily) dateField.updateAppearances(fontFamily);
  }
};

const setSignature = async (pdfDoc, agreement, form, fieldName, assignToField = null) => {
  let signatureField;
  if (assignToField) signatureField = form.getButton(assignToField);
  else signatureField = form.getButton(fieldName);
  const signature = agreement[fieldName];
  if (signatureField && signature) signatureField.setImage(await pdfDoc.embedPng(signature));
}

const fetchLocalPDF = async(pdfPath) => {
  // Read the PDF file as a buffer
  const pdfBuffer = await fs.promises.readFile(pdfPath);
  // console.log(pdfBuffer)
  // Convert the buffer to an ArrayBuffer
  const pdfBytes = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength
  );
  return pdfBytes;
}

const mailMergeAgreement = async (form) => {
  let agreement = form;
  // console.log(agreement);
  const pdfPath = path.join(__dirname, "../../public", "Tenancy_Agreement_v2.pdf");
  const pdfBytes = await fetchLocalPDF(pdfPath);
  // console.log("pdfBytes)
  // console.log(pdfBytes)
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanFontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const pdf = pdfDoc.getForm();

  // const fields = pdf.getFields();
  // fields.forEach((field) => {
  //   const type = field.constructor.name;
  //   const name = field.getName();
  //   console.log(`${name} ${type}` );
  // });
  // console.log(agreement)
  //Page 1
  setDate(agreement,pdf,"dateOfAgreement","dateOfAgreement[0]", true, timesRomanFont);
  setText(agreement,pdf,"hostName","hostName[0]",true, timesRomanFontBold);
  setText(agreement,pdf,"hostIdentityNo","hostIdentityNo[0]", true, timesRomanFontBold);
  setText(agreement,pdf,"tenantName","tenantName[0]", true, timesRomanFontBold);
  setText(agreement,pdf,"tenantIdentityNo","tenantIdentityNo[0]", true, timesRomanFontBold);

  //page 2
  setDate(agreement,pdf,"dateOfAgreement",null, false, timesRomanFont);
  if(agreement.tenantName.length < 20) setText(agreement,pdf,"tenantName","tenantNameShort", false, timesRomanFont);
  else setText(agreement,pdf,"tenantName",null, false, timesRomanFont);
  setText(agreement,pdf,"tenantIdentityNo",null, false, timesRomanFont);
  setText(agreement,pdf,"tenantMobile",null, false, timesRomanFont);
  setText(agreement,pdf,"tenantEmail",null, false, timesRomanFont);
  setText(agreement,pdf,"propertyAddress",null, false, timesRomanFont);

  //page 3 
  setText(agreement,pdf,"tenancyPeriod",null, false, timesRomanFont);
  setDate(agreement,pdf,"tenancyStartDate",null, false, timesRomanFont);
  setDate(agreement,pdf,"tenancyEndDate",null, false, timesRomanFont);
  setText(agreement,pdf,"monthlyRental",null, false, timesRomanFont);
  setText(agreement,pdf,"securityDeposit",null, false, timesRomanFont);
  setText(agreement,pdf,"utilityDeposit",null, false, timesRomanFont);
  if(agreement.accessCardDeposit)setText(agreement,pdf,"accessCardDeposit",null, false, timesRomanFont);
  if(agreement.parkingCardDeposit)setText(agreement,pdf,"parkingCardDeposit",null, false, timesRomanFont);

  //page 4
  if(agreement.hostName.length < 20) setText(agreement,pdf,"hostName", "hostNameShort", false, timesRomanFont);
  else setText(agreement,pdf,"hostName",null, false, timesRomanFont);
  setText(agreement,pdf,"hostIdentityNo", null, false, timesRomanFont);  
  if(agreement.hostSignatureImage) await setSignature(pdfDoc, agreement, pdf, 'hostSignatureImage');
  if(agreement?.hostSignDate) setDate(agreement,pdf,"hostSignDate",null, false, timesRomanFont);
  if(agreement.tenantSignatureImage) await setSignature(pdfDoc, agreement, pdf, 'tenantSignatureImage');
  if(agreement?.tenantSignDate) setDate(agreement,pdf,"tenantSignDate",null, false, timesRomanFont);

  pdf.flatten();
  const result = await pdfDoc.save();
  //   console.log(result);
  return result;
};

exports.previewAgreement = async (form) => {
  if (form) {
    let agreement = {
      ...form,
      dateOfAgreement: timezoneConvert(form.dateOfAgreement),   
      tenancyStartDate: timezoneConvert(form.tenancyStartDate),
      tenancyEndDate: timezoneConvert(form.tenancyEndDate),
    };

    if(form.hostSignDate) agreement.hostSignDate = timezoneConvert(form.hostSignDate)
    if(form.tenantSignDate)agreement.tenantSignDate = timezoneConvert(form.tenantSignDate)

    const pdfAgreement = await mailMergeAgreement(agreement);
    return {
      ok: true,
      pdfAgreement,
    };
  }
};

exports.signAgreement = async (etenancyId, hostSignatureImage) => {
  const etenancyFound = await getById(etenancyId);
  if (etenancyFound) {    
    const update = {
      "host.signatureImage": hostSignatureImage,
      "host.signDate": new Date(),
    };   
    const result = await etenancyModel.findByIdAndUpdate(
      etenancyFound._id,
      update,
      db.updateOption
    );    
    return result;
  }
};
