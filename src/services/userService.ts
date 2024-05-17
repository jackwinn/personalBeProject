//package
import { Express } from "express";

//lib
const dbs = require("../libs/db");

//component
import { userComponent } from "../components/userComponent";

module.exports = (app: Express) => {
  app.post("/user/:action", async (req, res) => {
    const action = req.params.action;
    const reqbody = req.body;
    console.log(`action: ${action}`);
    console.log(reqbody);

    const payloadValidation = (action: string, reqbody: any) => {
      if (action === "create" || action === "login") {
        if (!reqbody.email || !reqbody.password || !reqbody.role) {
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
        const result = await userComponent.create(
          reqbody.email,
          reqbody.password,
          reqbody.role
        );
        return result;
      },
      login: async () => {
        const result = await userComponent.login(
          reqbody.email,
          reqbody.password,
          reqbody.role
        );
        console.log(result);
        return result;
      },
      getById: async () => {
        const result = await userComponent.getById(reqbody.userId);
        return result;
      },
    };

    const handleSuccess = (result: any) => {
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
