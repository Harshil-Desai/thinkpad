import mongoose, { ConnectOptions } from "mongoose";

const connectDB = async () => {
    try {
        console.log(process.env.MONGO_URI)
        console.log(process.env.DB_NAME)
        await mongoose.connect(process.env.MONGO_URI as string + process.env.DB_NAME as string, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        } as ConnectOptions);
        console.log("MongoDB connected")
    }
    catch (error) {
        console.log("error:", error)
        process.exit(1)
    }
}

export default connectDB;