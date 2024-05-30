//package
const nconf = require("nconf");
const { PDFDocument, StandardFonts, TextAlignment } = require("pdf-lib");
const fetch = require("node-fetch");

// model
const etenancyModel = require("../models/etanancyModel");

//lib
const db = require("../libs/db");
const lib = require("../libs/lib");

//variable
const templateConfig = nconf.get("template");
const pagingConfig = nconf.get("paging");

exports.create = async (form) => {
  console.log("agreementData");
  console.log(form);
  // console.log(form.dateOfAgreement)

  const newEtenancy = new etenancyModel({
    _id: db.newId(),
    property: {
      name: form.propertyName,
      address: form.propertyAddress,
      monthlyRental: form.monthlyRental,
    },
    tenant: {
      name: form.tenantName,
      email: form.tenantEmail,
      mobile: form.tenantMobile,
      identity: {
        number: form.tenantIdentityNo,
        type: form.tenantIdentityType,
      },
    },
    tenancy: {
      period:
        form.tenancyPeriod !== "Other"
          ? form.tenancyPeriod
          : form.tenancyOtherPeriod,
      startDate: form.tenancyStartDate,
      endDate: form.tenancyEndDate,
    },
    deposit: {
      booking: form.bookingDeposit,
      security: form.securityDeposit,
      utility: form.utilityDeposit,
      accessCard: form.accessCardDeposit,
      parkingCard: form.parkingCardDeposit,
    },
    dateOfAgreement: new Date(),
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
    console.log("agreementData");
    console.log(form);
  
    const update = {   
      property: {
        name: form.propertyName,
        address: form.propertyAddress,
        monthlyRental: form.monthlyRental,
      },
      tenant: {
        name: form.tenantName,
        email: form.tenantEmail,
        mobile: form.tenantMobile,
        identity: {
          number: form.tenantIdentityNo,
          type: form.tenantIdentityType,
        },
      },
      tenancy: {
        period:
          form.tenancyPeriod !== "Other"
            ? form.tenancyPeriod
            : form.tenancyOtherPeriod,
        startDate: form.tenancyStartDate,
        endDate: form.tenancyEndDate,
      },
      deposit: {
        booking: form.bookingDeposit,
        security: form.securityDeposit,
        utility: form.utilityDeposit,
        accessCard: form.accessCardDeposit,
        parkingCard: form.parkingCardDeposit,
      },
    };
  
    try {
        const result = await eTenancies.findByIdAndUpdate(form._id, update, dbs.updateOption);        
        return result
    } catch (err) {
      throw err;
    }
  };

const searchCount = async (pipelines) => {
  const count = {
    $count: "records",
  };

  pipelines.push(count);

  let summary = {
    records: 0,
    pages: 0,
  };

  //console.log(pipelines);
  try {
    const result = await etenancyModel.aggregate(pipelines);
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

const searchOnly = async (pipelines, paging) => {
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
  pipelines.push(sort);
  if (skip) pipelines.push(skip);
  pipelines.push(limit);

  // console.log(pipelines);
  try {
    const result = await etenancyModel.aggregate(pipelines);
    //console.log('data.');
    //console.log(result);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.search = async (search, paging) => {
  let pipelines = [];
  let match = {};

  if (search.status) {
    match.status = search.status;
  }

  if (search.custom) {
    match.$or = [
      {
        "tenant.personal.name": new RegExp(search.custom, "i"),
      },
      {
        "property.name": new RegExp(search.custom, "i"),
      },
    ];
  }

  const matchStage = {
    $match: match,
  };

  try {
    let searchSummary;

    if (!paging || !paging.page || paging.page === 1) {
      const pipelinesCount = [...pipelines];
      searchSummary = await searchCount(pipelinesCount);
    }

    const pipelinesData = [...pipelines];
    const searchData = await searchOnly(pipelinesData, paging);

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

exports.getById = async (etenacyId) => {
  try {
    const result = await etenancyModel.findById(etenacyId);
    return result;
  } catch (err) {
    throw err;
  }
};

const specialFormatting = (fieldName, value, pdfType = "") => {
  if (fieldName === "tenantIdentityNo1[0]") return `NRIC : ${value}`;
  if (fieldName === "hostName") return `(${value})`;
  if (fieldName === "tenantPaidDate") return `(${value})`;
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

const selectRadioInput = (
  tenancyAgreement,
  form,
  fieldName,
  assignToField = null
) => {
  let radioGroup;

  try {
    if (assignToField) radioGroup = form.getRadioGroup(assignToField);
    else radioGroup = form.getRadioGroup(fieldName);
    const value = tenancyAgreement[fieldName];
    if (value && radioGroup) radioGroup.select(value);
  } catch (err) {
    // console.log(err);
    throw err;
  }
};

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

const formatDateDMY = (date) => {
  let dateValue = new Date(date);
  let formatDate = moment(dateValue).format("DD/MM/YY");
  return formatDate;
};

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

const mailMergeAgreement = async (tenancyAgreement) => {
  let agreement = tenancyAgreement;
  //   console.log(tenancyAgreement);
  const pdfUrl = templateConfig.tenancyAgreement;
  const pdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanFontBold = await pdfDoc.embedFont(
    StandardFonts.TimesRomanBold
  );

  const form = pdfDoc.getForm();

  const fields = form.getFields();
  fields.forEach((field) => {
    const type = field.constructor.name;
    const name = field.getName();
    // console.log(`${type}: ${name}`);
  });
  // console.log("Line 206")
  // console.log(tenancyAgreement)

  // Page 1
  // hardcode center align text bcoz cant find a way to align first item of the same field name
  // setDate(agreement, form, 'dateOfAgreement', 'dateOfAgreement[0]', monthNameFormat, true, timesRomanFont,);
  // if (agreement.tenantName1.length < 20) {
  //     setText(agreement, form, 'tenantName1', 'tenantName1Short[0]', true, timesRomanFontBold,);
  //     setText(agreement, form, 'tenantName1', 'tenantName1Short', false, timesRomanFont)
  // } else {
  //     setText(agreement, form, 'tenantName1', 'tenantName1[0]', true, timesRomanFontBold,);
  //     setText(agreement, form, 'tenantName1', null, false, timesRomanFont);
  // }
  // setText(agreement, form, 'tenantIdentityNo1', 'tenantIdentityNo1[0]', true, timesRomanFontBold,);
  // setDate(agreement, form, 'dateOfAgreement', null, monthNameFormat, false, timesRomanFont);

  // setText(agreement, form, 'tenantIdentityNo1', null, false, timesRomanFont);

  // //Page 15
  setText(agreement, form, "propertyAddress", null, false, timesRomanFont);
  // setText(agreement, form, 'tenantMobile1', null, false, timesRomanFont);
  // setText(agreement, form, 'tenantEmail1', null, false, timesRomanFont);

  // //Page 16
  // setText(agreement, form, 'tenancyPeriod', null, false, timesRomanFont);
  // setDate(agreement, form, 'tenancyStartDate', null, monthNameFormat, false, timesRomanFont);
  // setDate(agreement, form, 'tenancyEndDate', null, monthNameFormat, false, timesRomanFont);
  // setText(agreement, form, 'basicMonthlyRental', null, false, timesRomanFont);
  // setText(agreement, form, 'tenantPaidAmount', null, false, timesRomanFont);

  // setText(agreement, form, 'securityDeposit', null, false, timesRomanFont, 'Tenancy');
  // // console.log(agreement.securityDeposit)
  // if (parseInt(agreement.securityDeposit) === 0) {
  //     agreement.securityDepositRule = 'need compensate one month rental'
  // } else {
  //     agreement.securityDepositRule = 'will forfeit half month rental deposit'
  // }
  // setText(agreement, form, 'securityDepositRule', null, false, timesRomanFontBold);

  // // console.log(agreement.securityDepositRule)
  // setText(agreement, form, 'utilityDeposit', null, false, timesRomanFont);
  // setText(agreement, form, 'accessCardDeposit', null, false, timesRomanFont);
  // setText(agreement, form, 'parkingCardDeposit', null, false, timesRomanFont);

  // //Page 17
  // setText(agreement, form, 'accessCardNo', null, false, timesRomanFont);
  // setText(agreement, form, 'numberOfCarpark', null, false, timesRomanFont);

  // //Page 21
  // // setText(tenancyAgreement, form, 'hostName', null, false, timesRomanFont);
  // setDate(agreement, form, 'hostSignDate', null, monthNameFormat, false, timesRomanFont);
  // setDate(agreement, form, 'tenantSignDate1', null, monthNameFormat, false, timesRomanFont);
  // await setSignature(pdfDoc, agreement, form, 'hostSignatureImage');
  // await setSignature(pdfDoc, agreement, form, 'tenantSignatureImage', 'tenantSignatureImage1');

  form.flatten();
  const result = await pdfDoc.save();
  //   console.log(result);
  return result;
};

exports.previewAgreement = async (formData) => {
  if (formData) {
    let data = {
      ...formData,
      // dateOfAgreement: timezoneConvert(formData.dateOfAgreement),
      // hostSignDate: timezoneConvert(formData.hostSignDate),
      // tenantSignDate1: timezoneConvert(formData.tenantSignDate1),
      // tenancyStartDate: timezoneConvert(formData.tenancyStartDate),
      // tenancyEndDate: timezoneConvert(formData.tenancyEndDate)
    };

    const pdfAgreement = await mailMergeAgreement(data);
    return {
      ok: true,
      pdfAgreement,
    };
  }
};
