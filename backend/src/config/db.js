import mongoose from "mongoose";


//function to connect mongodb database with server
export const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => { //Event Listener on connection for an event'connected'
            console.log("Database Connected!!");
        })

        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/gym_slot_booking`); //use to connect database with MongoDB_URI

        console.log(`Database Connected on ${connectionInstance.connection.host}`);
        


    } catch(error){
        
        console.log(error);
        process.exit(1);
    }
}