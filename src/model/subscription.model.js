import mongoose, { Mongoose } from "mongoose";

const subscriptionSchema=new mongoose.Schema({
    subscriber:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
        
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    }
},{
    timestamps:true
});


export default Subscription=mongoose.model("Subscription",subscriptionSchema);