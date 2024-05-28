import { User } from "../model/users.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asynHandler.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    // console.log(user.generateAccessToken);
    const accessToken = await user.generateAccessToken();
    // console.log(accessToken);
    const refreshToken = await user.generateRefreshToken();

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError("Some Internal Error", 500);
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get details from user
  // validate details
  // check user already exist or not
  // check avatar upload or not, cover image is there or not
  // upload to cloudinary
  // create user object and create entry in db
  // check response is there or not
  // give response to client after remove password and refersh token from object create in db
  console.log(req);

  const { userName, email, fullName, password } = req.body;

  // if(!userName || !email || !fullName || !avatar || !password){
  //     throw new ApiError("some filds missing",400)
  // }

  if (
    [userName, email, password, fullName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError("Some field missing ", 400);
  }

  // check if user already exist or not

  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existedUser) {
    throw new ApiError("Username or Email already exists", 409);
  }
  const avatarLoaclPath = req.files?.avatar?.[0].path;
  const coverImageLocalPath = req.files?.coverImage?.[0].path;
  console.log("hello i sucess fully ");

  if (!avatarLoaclPath) {
    throw new ApiError("Avatar image not exist", 409);
  }

  const avatar = await uploadOnCloudinary(avatarLoaclPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError("Avatar upload error on server", 500);
  }

  const user = await User.create({
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError("Somethign went wrong while regsitering", 500);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //  extract data from req body
  // validate email or usename or password all things
  // match it with saved data
  // genearet access token and refresh token
  //  send these token in response
  //   console.log(req);
  const { email, userName, password } = req.body;

  //   console.log(email,userName,password);

  if ((!email && !userName) || !password || !password.length) {
    throw new ApiError("some fields are missing or incorrect", 400);
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError("Some fields are incorrect", 400);
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(
      "Some fields are incorrect please check and login again",
      404
    );
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  console.log("i suceess fully find user compare passwrod");
  user.refreshToken = refreshToken;
  const updatedUser = await user.save();
  //   user.accessToken=accessToken;

  const options = {
    httpOnly: true,
    secure: true,
  };

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //   console.log(loggedInUser.password,loggedInUser.refreshToken,loggedInUser.userName);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        202,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user Logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError("Logout not sucessfull please try again", 401);
  }

  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(201, {}, "Logout sucessfully"));
});

const regenrateAccessToken = asyncHandler(async (req, res) => {
  const refreshTokenCookie =
    req.cookies?.refreshToken || req.body.refreshToken || undefined;
  if (!refreshTokenCookie) {
    throw new ApiError("Unauthorized extended session request", 401);
  }

  try {
    const decodedToken = await jwt.verify(
      refreshTokenCookie,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError("User Not found please try again", 500);
    }
    if (user?.refreshToken !== refreshTokenCookie) {
      throw new ApiError("refresh token expiry or invalid", 401);
    }

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user?._id);

    user.refreshToken = refreshToken;
    const updatedUser = await user.save();
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(201, {}, "Session extended successfully"));
  } catch (error) {
    throw new ApiError(
      error?.message || "Something gone wrong in extending session internal server error",
      500
    );
  }
});

export { registerUser, loginUser, logoutUser, regenrateAccessToken };
