//package
const nconf = require("nconf");

// model
const etenancyModel = require("../models/etanancyModel");

//lib
const db = require("../libs/db");
const lib = require("../libs/lib");

//variable
const templateConfig = nconf.get('template');
const pagingConfig = nconf.get("paging");

exports.create = async (form) => {
    console.log("agreementData")
    // console.log(form)
    // console.log(form.dateOfAgreement)  

    const newEtenancy = new etenancyModel({
        _id: db.newId(),
        // property details 
        propertyUnit: {
            // _id: form.propertyUnit,
            fullAddress: form.propertyAddress,
            roomType: form.propertyRoomType,
            code: form.propertyCode,
            numberOfTenant: form.numberOfTenant,
            numberOfCarpark: form.numberOfCarpark,
            carParkRental: form.carParkRental,
            basicMonthlyRental: form.basicMonthlyRental,
        },
        // propertyRoom: {
        //     _id: form.propertyRoom,
        // },
        // // tenant details 1 
        // mainTenant: {
        //     _id: form.tenantId1,
        //     title: form.tenantTitle1,
        //     race: form.tenantRace1,
        //     otherRace: form.tenantOtherRace1
        // },
        // // tenant details 2
        // subTenant: {
        //     name: form.tenantName2,
        //     identity: {
        //         number: form.tenantIdentityNo2,
        //         type: form.tenantIdentityType2,
        //     },
        //     mobile: form.tenantMobile2,
        //     email: form.tenantEmail2,
        //     gender: form.tenantGender2,
        //     title: form.tenantTitle2,
        //     race: form.tenantRace2,
        //     otherRace: form.tenantOtherRace2
        // },

        // //access card details
        // accessCardNo: form.accessCardNo,

        // //deposit details
        // deposit: {
        //     advanceRentalMonth: form.advanceRentalMonth,
        //     advanceRental: form.advanceRental,
        //     securityMonth: form.securityDepositMonth,
        //     security: form.securityDeposit,
        //     utilityMonth: form.utilityDepositMonth,
        //     utility: form.utilityDeposit,
        //     accessCard: form.accessCardDeposit,
        //     assuranceAgreement: form.assuranceAgreement,
        //     totalToBePaid: form.depositTotalToBePaid,
        // },

        // tenantPayment: {
        //     amount: !form.tenantPaidAmount ? 0 : form.tenantPaidAmount,
        //     date: form.tenantPaidDate ? form.tenantPaidDate : undefined,
        // },
        // balanceAmount: parseInt(form.balanceAmount),

        // // tenancy details
        // tenancy: {
        //     period: form.tenancyPeriod,
        //     otherPeriod: form.tenancyOtherPeriod,
        //     startDate: form.tenancyStartDate,
        //     endDate: form.tenancyEndDate,
        // },

        // contract: {
        //     host: form.hostId,
        //     hostSignDate: form.hostSignDate,
        //     isHostSigned: false,
        //     tenant: form.tenantId1,
        //     tenantSignDate: form.tenantSignDate1,
        //     isTenantSigned: false
        // },

        // dateOfAgreement: form.dateOfAgreement,
        // status: "New",

        // emergencyContact: {
        //     name: form.emergencyContactName,
        //     title: form.emergencyContactTitle,
        //     mobile: form.emergencyContactMobile,
        //     relationWithTenant: form.emergencyContactRelationWithTenant,
        // },
        // referee: {
        //     name: form.refereeName,
        //     title: form.refereeTitle,
        //     mobile: form.refereeMobile,
        //     relationWithTenant: form.refereeRelationWithTenant,
        // },
    });

    try {
        const result = await newEtenancy.save()
        return result

    } catch (err) {
        throw (err)
    }
};

const searchCount = async (pipelines) => {
    const count = {
        $count: 'records'
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
    let skip, limit = { $limit: pagingConfig.limit };
    const sort = {
        $sort: {
            created: - 1
        }
    }

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
    let pipelines = []
    let match = {}


    // if (search.status) {
    //     match.status = search.status
    // }

    // if (search.custom) {
    //     match.$or = [{
    //         'mainTenant.personal.name': new RegExp(search.custom, "i")
    //     }, {
    //         'propertyRoom.name': new RegExp(search.custom, "i")
    //     }]
    // }

    const matchStage = {
        $match: match
    }


    try {
        let searchSummary;

        if ((!paging) || (!paging.page) || (paging.page === 1)) {
            const pipelinesCount = [...pipelines];
            searchSummary = await searchCount(pipelinesCount);
        }

        const pipelinesData = [...pipelines];
        const searchData = await searchOnly(pipelinesData, paging);

        let result = {
            data: searchData,
            summary: {}
        };

        if (searchSummary) result.summary = searchSummary;
        return result;
    } catch (err) {
        throw err;
    }
};

const getById = async (id) => {
    try {
        const result = await etenancyModel.findById(id);
        return result;
    } catch (err) {
        throw err;
    }
};
