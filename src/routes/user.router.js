import { Router } from "express";
import {
  logoutUser,
  registerUser,
  loginUser,
  regenrateAccessToken,
  changePassword,
  getCurrentUser,
  accountDetailsUpdate,
  updateAvatar,
  updateCoverImage,
  getUserProfile,
  getWatchHistory,
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
router.route("/refresh-token").post(regenrateAccessToken);
router.route("/change-password").post(verifyJwt, changePassword);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/update-account").patch(verifyJwt, accountDetailsUpdate);
router
  .route("/update-avatar")
  .patch(verifyJwt, upload.single("avatar"), updateAvatar);
router
  .route("/update-cover-image")
  .patch(verifyJwt, upload.single("coverImage"), updateCoverImage);
router.route("/user-profile/:userName").get(verifyJwt, getUserProfile);
router.route("/watch-history").get(verifyJwt, getWatchHistory);

export default router;
