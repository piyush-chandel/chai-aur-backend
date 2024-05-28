import { User } from "../model/users.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asynHandler.js";
import jwt from 'jsonwebtoken';

// we write res as we not use response in method

export const verifyJwt=asyncHandler(async (req,_,next)=>{

 try {
    const accessToken=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    if(!accessToken){
       throw new ApiError("Unauthorized request",401);
    }
    
    const decodedToken=  jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
    const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
    if(!user){
       throw new ApiError("Invalid acess token",401);
    }
   
   
    req.user=user;
    next();
 } catch (error) {

    throw new ApiError(error?.message || "Something wen wrong",500);
    
 }

})