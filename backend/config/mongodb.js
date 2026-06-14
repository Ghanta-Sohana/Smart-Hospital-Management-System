import mongoose from "mongoose";

// const connectDB = async () => {

//     mongoose.connection.on('connected', () => console.log("Database Connected"))
//     await mongoose.connect(`${process.env.MONGODB_URI}/prescripto`)

// }

// export default connectDB;

// Do not use '@' symbol in your databse user's password else it will show an error.

const connectDB = async ()=>{
    try{
        mongoose.connection.on("connected",()=>console.log("Database Connected"));
        await mongoose.connect(`${process.env.MONGODB_URI}/prescripto`);
    }
    catch(error){
        console.log(error);
    }
};

export default connectDB;