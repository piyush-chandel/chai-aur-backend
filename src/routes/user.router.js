import { Router } from "express";
import {
  logoutUser,
  registerUser,
  loginUser,
  regenrateAccessToken,
} from "../controllers/users.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured route before acecess we have to verify jwt token first

router.route("/logout").post(verifyJwt, logoutUser);
router.route("/extended").post(regenrateAccessToken);

export default router;
