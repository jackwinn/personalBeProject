    //dbs
const dbs = require("../libs/db");

//components
const userComponent = require("../components/userComponent");

import { Express } from 'express';


module.exports = (app: Express) => {
    app.post("/users/:action", async (req, res) => {
      const action = req.params.action;
      const reqBody = req.body;
      // console.log(`action: ${action}`)
      // console.log(reqBody);
  
      const payloadValidation = (action, reqBody) => {
        // if (action === "login") {
        //   if (!reqBody?.personal?.email || !reqBody?.personal?.password || !reqBody.role) {
        //     return res.status(422).end();
        //   }
        // }
        // if (action === "create") {
        //   if (!reqBody?.personal?.name || !reqBody?.personal?.mobile || !reqBody?.personal?.email || !reqBody.role) {
        //     return res.status(422).end();
        //   }
        // }
        // if (action === "isEmailUnique") {
        //   if (!reqBody.email || !reqBody.role) {
        //     return res.status(422).end();
        //   }
        // }
        // if (action === "isMobileUnique") {
        //   if (!reqBody.mobile || !reqBody.role) {
        //     return res.status(422).end();
        //   }
        // }
        // if (action === "updateProfile") {
        //   if (!reqBody._id || !dbs.isMongoDbObjectId(reqBody._id) || !reqBody?.personalName || !reqBody?.personalMobile) {
        //     return res.status(422).end();
        //   }
        // }
        // if (action === "forgotPassword") {
        //   if (!reqBody?.personal?.email || !reqBody.role) {
        //     return res.status(422).end();
        //   }
        // }
        if (action === "getById") {
          if (!reqBody._id || !dbs.isMongoDbObjectId(reqBody._id)) {
            return false
          }
        }
        // if (action === "comparePassword") {
        //   if (!reqBody._id || !dbs.isMongoDbObjectId(reqBody._id) || !reqBody?.oldPassword || !reqBody.newPassword) {
        //     return res.status(422).end();
        //   }
        // }
        // if (action === "isCompanyEmailUnique") {
        //   if (!reqBody.email || !reqBody.role) {
        //     return res.status(422).end();
        //   }
        // }
        return {
          ok: true,
        };
      };
  
      const actionHandlers = {
        // newId: async () => {
        //   const result = dbs.newId();
        //   return result;
        // },
        // login: async () => {
        //   const result = await userComponent.login(reqBody.personal.email, reqBody.personal.password, reqBody.role);
        //   return result;
        // },
        // create: async () => {
        //   const result = await userComponent.create(reqBody);
        //   return result;
        // },
        // isEmailUnique: async () => {
        //   const result = await userComponent.isEmailUnique(reqBody.email, req.body.role);
        //   return result;
        // },
        // isMobileUnique: async () => {
        //   const result = await userComponent.isMobileUnique(reqBody.mobile, reqBody.role);
        //   return result;
        // },
        // updateProfile: async () => {
        //   const result = await userComponent.updateProfile(reqBody);
        //   return result;
        // },
        // forgotPassword: async () => {
        //   const result = await userComponent.forgotPassword(reqBody.personal.email, reqBody.role);
        //   return result;
        // },
        getById: async () => {
          return await userComponent.getById(reqBody._id);
        },
        // comparePassword: async () => {
        //   const result = await userComponent.comparePassword(reqBody);
        //   return result;
        // },
        // isCompanyEmailUnique: async () => {
        //   const result = await userComponent.isCompanyEmailUnique(reqBody.email, reqBody.role, reqBody.role._id);
        //   return result;
        // }
      };
  
      // Check if the requested action exists
      if (actionHandlers[action]) {
        const validation = payloadValidation(action, reqBody);
        if (validation.ok) {
          try {
            const result = await actionHandlers[action]();
            if (action === "login") {
              if (!result) return res.status(401).json({ message: "Invalid username/password. Please try again" })
              if (result?.status === "Inactive") return res.status(403).json({ message: "Your account has been inactive." });
            }
            if (action === "forgotPassword") {
              // console.log("forgotPassword result")
              // console.log(result)
              if (result) return res.json({ message: "Password reset request was sent successfully. Please check your email to reset your password." });
              return res.status(404).json({ message: "This email is not associated with any of our user accounts." });
            }
            return res.json(result);
          } catch (err) {          
            throw err;
          }
        }
      } else return res.status(412).end(); // Precondition Failed for unsupported action
    });