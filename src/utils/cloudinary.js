import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET_KEY,
});


const uploadOnCloudinary=async (localfilePath)=>{

    try {
        if(!localfilePath) return null;

        // upload local file from server to cloudinary

        const response=await cloudinary.uploader.upload(localfilePath,{
            resource_type:"auto"
        })

        console.log("file uploaded and response url is",response.url);
        fs.unlinkSync(localfilePath);
        return response;

    
    } catch (error) {
        fs.unlinkSync(localfilePath);
        // remove locally svae temporary file as file not upload on cloudinary 
        return null;
    }}

    export {uploadOnCloudinary};