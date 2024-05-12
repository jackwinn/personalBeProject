//packages
import { Express } from "express";

//dbs
const dbs = require("../libs/db");

//components
const userComponent = require("../components/userComponents");


module.exports = (app: Express) => {
  app.post("/users/:action", async (req, res) => {
    const action = req.params.action;
    const reqBody = req.body;
    // console.log(`action: ${action}`)
    // console.log(reqBody);

    const requestBodyValidation = (action: string, reqBody: any) => {
      if (action === "getById") {
        if (!reqBody._id || !dbs.isMongoDbObjectId(reqBody._id)) {
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
      getById: async () => {
        const result = await userComponent.getById(reqBody._id);
        return result
      },
    };

    const handleSuccess = (result: any) => {
      return res.json(result);
    };

    const handleError = (err: any) => {
      throw err;
    };

    // Check if the requested action exists
    if (actionHandlers[action]) {
      const validation = requestBodyValidation(action, reqBody);
      if (validation.ok) {
        try {
          const result = await actionHandlers[action]();
          handleSuccess(result);
        } catch (err) {
          handleError(err);
        }
      }
    } else {
      return res.status(412).end(); // Precondition Failed for unsupported action
    }
  });
};
