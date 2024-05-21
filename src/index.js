import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dbName } from './constants.js';
import express from 'express';
import dbConnect from './db/dbConnect.js';



dotenv.config({
    path:'./.env',
})

dbConnect();






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