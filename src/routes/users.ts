import express from "express";
const router = express.Router();
// Require controller modules.
import * as userController from "../controllers/users";

router.post('/create', userController.createUser);
router.post('/confirm-account', userController.activateUserAccount);
router.post('/login', userController.loginUser);



export default router;
