//package
const jwt = require("jsonwebtoken");
require("dotenv").config();

//lib
const dbs = require("../libs/db");

//component
const userComponent  = require("../components/userComponent");

module.exports = (app) => {
  app.post("/user/:action", async (req, res) => {
    const action = req.params.action;
    const reqbody = req.body;
    console.log(`action: ${action}`);
    console.log(reqbody);

    const payloadValidation = (action, reqbody) => {
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

  const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      console.log(token);
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, data) => {
          if (err) {
            return res.sendStatus(403); // Forbidden
          }
          console.log("user");
          console.log(data);
          req.body.userId = data.userId;
          next();
        }
      );
    } else {
      res.sendStatus(401); // Unauthorized
    }
  };

  app.get("/protected-route", authenticateJWT, async (req, res) => {
    // if (!dbs.isMongoDbObjectId(req.body.userId)) {
    const result = await userComponent.getById(req.body.userId);
    if (result) {
      return res.json({ message: "This is a protected route", user: result });
    }
    // } else {
    //   return res.status(422).end();
    // }
  });
};
