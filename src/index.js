import mongoose from "mongoose";
import dotenv from "dotenv";
import { dbName } from "./constants.js";
import express from "express";
import dbConnect from "./db/dbConnect.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

dbConnect()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is listening on Port ${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => {
    console.log("Mongodb connecction failed error: ", error);
  });







  
// we can use this appproach also but code beacme messy and difficult to understand
// const app=express();

// (async ()=>{

// try {
//      mongoose.connect(`${process.env.MONGODB_URI}/${dbName}`);
//      app.on("error",(error)=>{
//         console.log("Express app cant connnect ", error);
//         throw error;
//      });

//      app.listen(process.env.PORT,()=>{
//         console.log("Server listening on Port and connect to database also",process.env.PORT);
//      })

// } catch (error) {
//     console.error("Error",error);
//     throw error;
// }
// })();
