import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      unique: [true, "username shhoul be unique"],
      required: true,
      lowercase: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      unique: [true, "Email Already Exists"],
      required: true,
      trim: true,
      lowercase: true,
    },

    fullName: {
      type: String,
      trim: true,
      index: true,
      required: [true, "Full Name can't be empty"],
    },
    avatar: {
      type: String, // cloudnery url ,
      required: true,
    },
    coverImage: {
      type: String, // cloudnery
    },
    password: {
      type: String,
      required: [true, "Password must be at least 8 characters long"],
    //   minlength: [8, "Password must be at least 8 characters long"],
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Video",
      },
    ],
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save",async function(next){
    if(this.isModified("password"))
    this.password=await bcrypt.hash(this.password,10);

    next();

})


userSchema.methods.isPasswordCorrect= async function(password){
  
 
    return await bcrypt.compare(password,this.password);

}

userSchema.methods.generateAccessToken=async function(){
    //  console.log("reached to access token function",this);
    const token=   jwt.sign({
        _id:this._id,
        email:this.email,
        userName:this.userName,
        fullName:this.fullName
    },
  process.env.ACCESS_TOKEN_SECRET,
{
    expiresIn:process.env.ACCESS_TOKEN_EXPIRY
})

// console.log(token);
return token;
}


 userSchema.methods.generateRefreshToken=async function(){
   return  jwt.sign({
    _id:this._id,
    userName:this.userName,
    fullName:this.fullName,
    email:this.email,
   },process.env.REFRESH_TOKEN_SECRET,{
    expiresIn:process.env.REFRESH_TOKEN_EXPIRY
   });
}

export const User = mongoose.model("User", userSchema);
