//package

//lib
const dbs = require("../libs/db");

//component
const etenancyComponent = require("../components/etenancyComponent");

module.exports = (app) => {
  app.post("/eTenancy/:action", async (req, res) => {
    const action = req.params.action;
    const reqbody = req.body;
    console.log(`action: ${action}`);
    console.log(reqbody);

    const payloadValidation = (action, reqbody) => {
      // if (action === "create") {
      //   if (!reqbody.email || !reqbody.password || !reqbody.role) {
      //     return {
      //       ok: false,
      //     };
      //   }
      // }
      if (action === "search") {
        if (!reqbody.search || !reqbody.paging) {
          return {
            ok: false,
          };
        }
      }
      if (action === "getById") {
        if (!reqbody.userId || !dbs.isMongoDbObjectId(reqbody.userId)) {
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
        const result = await etenancyComponent.create(
          reqbody,
          //   reqbody.email,
          //   reqbody.password,
          //   reqbody.role
        );
        return result;
      },
      search: async () => {
        const result = await etenancyComponent.search(
          reqbody.search,
          reqbody.paging,
        );
        console.log(result);
        return result;
      },
      getById: async () => {
        const result = await etenancyComponent.getById(reqbody.etenancyId);
        return result;
      },
    };

    const handleSuccess = (result) => {
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
