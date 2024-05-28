import { User } from "../model/users.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asynHandler.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcrypt";
import { Video } from "../model/videos.model.js";
import mongoose from "mongoose";

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
      error?.message ||
        "Something gone wrong in extending session internal server error",
      500
    );
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body();
  if (newPassword !== confirmNewPassword) {
    throw new ApiError("New password and cofirm password not same", 401);
  }

  const user = await User.findById(req?.user?._id).select("-refreshToken");
  if (!user) {
    throw new ApiError("Please try again later", 500);
  }

  const isOldPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isOldPasswordValid) {
    throw new ApiError("Old Password not valid please try again", 401);
  }

  user.password = newPassword;
  const updatedUser = await user.save({ validateBeforeSave: false });
  if (!updatedUser) {
    throw new ApiError("Password can't be updated Please try after some time");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "User password updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(201, req.user, "Current user fetched successfully"));
});

const accountDetailsUpdate = asyncHandler(async (req, res) => {
  const { fullName } = req.body();
  const user = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: { fullName },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(
      "Please try after some time for update account details",
      500
    );
  }
  req.user = user;

  return res
    .status(200)
    .json(new ApiResponse(201, user, "Account details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLoaclPath = req?.file.path || undefined;
  if (!avatarLoaclPath) {
    throw new ApiError("avatar file is missing", 400);
  }

  const avatarPublicPath = await uploadOnCloudinary(avatarLoaclPath);
  if (!avatarPublicPath.url) {
    throw new ApiError("Some issue in uuploading file", 500);
  }
  const updatedUser = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        avatar: avatarPublicPath.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(
      "Somethign went wrong in update photo please try again",
      500
    );
  }
  req.user = updatedUser;
  return res
    .status(200)
    .json(new ApiResponse(201, req?.user || {}, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLoaclPath = req?.file.path || undefined;
  if (!coverImageLoaclPath) {
    throw new ApiError("cover image file is missing", 400);
  }

  const coverImagePublicPath = await uploadOnCloudinary(coverImageLoaclPath);
  if (!coverImagePublicPath.url) {
    throw new ApiError(
      "Some issue in uploading cover image  file on cloudinary",
      500
    );
  }
  const updatedUser = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        avatar: coverImagePublicPath.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(
      "Somethign went wrong in update photo in database please try again",
      500
    );
  }
  req.user = updatedUser;
  return res
    .status(200)
    .json(
      new ApiResponse(201, req?.user || {}, "cover image updated successfully")
    );
});

const getUserProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName?.trim()) {
    throw new ApiError("username not in params", 400);
  }

  const channel = await User.aggregate(
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      // subscription model mai kitne baar ye channel aaya hai utne hi subscriber honge
      // aur iska naam kitne baar subscriber mai hai utno ko isne subscribe kar rkha hai
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribersTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscibers",
        },
        subscribeToCount: {
          $size: "$subscribersTo",
        },
        isSubscriberOrNot: {
          $condition: {
            if: { $in: [req?.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: fallse,
          },
        },
      },
    },
    {
      $project: {
        userName: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        subscribeToCount: 1,
        isSubscriberOrNot: 1,
        email: 1,
      },
    }
  );
  // used to do console channell what type of value it returns

 if(!channel?.length){
    throw new ApiError("channel doesn't exisit",404);
 }

 return res.status(200)
            .json(new ApiResponse(201,channel?.[0],"user profile fetched successfully"));

});

const getWatchHistory=asyncHandler(async(req,res)=>{
   
    const user=await User.aggregate([
        {
        $match:{
            _id:new mongoose.Types.ObjectId(req.user?._id)
        }
    },{
        $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project:{
                                    fullName:1,
                                    avatar:1,
                                    userName:1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                        
                    }
                }
            ]
        }
    }

])


if(!user){
    throw new ApiError("watch history can't be fetch",500);
}

return res.status(200)
           .json(new ApiResponse(201,user[0].watchHistory,"watch history fetched successfully"));

})

export {
  registerUser,
  loginUser,
  logoutUser,
  regenrateAccessToken,
  changePassword,
  getCurrentUser,
  accountDetailsUpdate,
  updateCoverImage,
  updateAvatar,
  getUserProfile,
  getWatchHistory
};
