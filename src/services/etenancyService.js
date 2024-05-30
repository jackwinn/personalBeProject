//package

//lib
const dbs = require("../libs/db");

//component
const etenancyComponent = require("../components/etenancyComponent");

module.exports = (app) => {
  app.post("/eTenancy/:action", async (req, res) => {
    const action = req.params.action;
    const reqbody = req.body;
    // console.log(`action: ${action}`);
    // console.log(reqbody);

    const payloadValidation = (action, reqbody) => {
      if (action === "create" || action === "edit") {
        if (!reqbody.propertyName || !reqbody.tenantName) {
          return {
            ok: false,
          };
        }
      }
      if (action === "search") {
        if (!reqbody.search || !reqbody.paging) {
          return {
            ok: false,
          };
        }
      }
      if (action === "getById") {
        if (!reqbody._id || !dbs.isMongoDbObjectId(reqbody._id)) {
          return {
            ok: false,
          };
        }
      }
      return {
        ok: true,
      };
    };

    const actionHandlers = {
      create: async () => {
        const result = await etenancyComponent.create(reqbody);
        return result;
      },
      edit: async () => {
        const result = await etenancyComponent.edit(reqbody);
        return result;
      },
      search: async () => {
        const result = await etenancyComponent.search(
          reqbody.search,
          reqbody.paging
        );
        // console.log(result);
        return result;
      },
      getById: async () => {
        const result = await etenancyComponent.getById(reqbody._id);
        return result;
      },
      previewAgreement: async () => {
        const result = await etenancyComponent.previewAgreement(reqbody);
        return result;
      },
    };

    const handleSuccess = (result) => {
      if (action === "previewAgreement") {
        // console.log("PEEK AGREEMENT")
        // console.log(result)
        if (result.ok) {
          res.writeHead(200, { "Content-Type": "application/pdf" });
          // console.log(typeof(result.pdfAgreement))
          res.write(result.pdfAgreement);
          res.end();
          return;
        }
      }

      return res.json(result);
    };

    // Check if the requested action exists
    if (actionHandlers[action]) {
      const validation = payloadValidation(action, reqbody);
      if (validation.ok) {
        try {
          const result = await actionHandlers[action]();
          handleSuccess(result);
        } catch (err) {
          res.status(500).end();
          throw err;
        }
      } else {
        return res.status(422).end();
      }
    } else {
      return res.status(412).end(); // Precondition Failed for unsupported action
    }
  });
};
