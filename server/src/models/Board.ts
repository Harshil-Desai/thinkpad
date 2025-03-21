import mongoose, { Mongoose } from "mongoose";
import User from "./User";

const boardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    canvasData: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User
    },
    sharedWith: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: User
        }
    ],
    thumbnail:
    {
        type: String
    }
}, { timestamps: true })

const Board = mongoose.model("Board", boardSchema)

export default Board