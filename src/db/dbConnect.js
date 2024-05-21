import mongoose from "mongoose";
import { dbName } from "../constants.js";

const  dbConnect=async()=>{
    try {
       const ConnectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${dbName}`);
       console.log(`Mongo db db connect sucessfully and return ${ConnectionInstance.connection.host}`);
    //    console.log(ConnectionInstance);
    } catch (error) {
        console.error("Mongodb connection failed :",error);
        process.exit(1);
    }
}

export default dbConnect;