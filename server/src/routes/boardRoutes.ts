import express from "express"
import multer from "multer"
import Board from "../models/Board"
import User from "../models/User";
import path from "path";
import { saveImageToStorage } from "../app";
import { error } from "console";
import sharp from "sharp";
import { compressImage } from "../utils/utils";

const fs = require("fs")
const upload = multer({
    dest: "uploads/",
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true)
        }
        else {
            cb(new Error("File type not supported"))
        }
    }
});

const router = express.Router();

router.post("/", async (req: any, res) => {
    const { name, canvasData, createdBy } = req.body;
    try {
        const board = await Board.create(req.body)
        res.status(201).json({
            message: "Board created successfully",
            data: board
        });
    } catch (err) {
        res.status(400).json({
            message: "Error creating the board",
            error: err
        })
    }
})

router.get("/", async (req, res) => {
    try {
        const boards = await Board.find();
        res.status(200).json(boards)
    }
    catch (err) {
        res.status(500).json({
            message: "Something went wrong",
            error: err
        })
    }
})

router.get("/:id", async (req, res) => {
    try {
        const board = await Board.findById(req.params.id)
        if (!board)
            res.status(404).json({
                message: "Board not found"
            })
        res.status(200).json(board)
    }
    catch (err) {
        res.status(500).json({
            message: "Something went wrong",
            error: err
        })
    }
})

router.put("/:id", async (req, res) => {
    try {
        const board = await Board.findByIdAndUpdate(req.params.id, req.body);
        res.status(200).json(board)
    }
    catch (err) {
        res.status(500).json({
            message: "Something went wrong",
            error: err
        })
    }
})

router.delete("/:id", async (req, res) => {
    try {
        await Board.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Board deleteed successfully" })
    }
    catch (err) {
        res.status(500).json({
            message: "Something went wrong",
            error: err
        })
    }
})

router.put("/share/:id", async (req, res) => {
    const { sharedWith } = req.body;
    try {
        const board = await Board.findById(req.params.id);
        if (!board) {
            res.status(404).json({
                message: "Board not found"
            })
        }

        const users = await User.find({ email: { $in: sharedWith } }, '_id')
        const userIds = users.map((e) => e._id)

        userIds.forEach(async (element: any) => {
            if (!board?.sharedWith.includes(element)) {
                board?.sharedWith.push(element);
            }
        });
        await board?.save()

        res.status(200).json({
            message: "Board shared successfully",
            board: board
        })
    }
    catch (err) {
        res.status(500).json({
            message: "Something went wrong",
            error: err
        })
    }
})

router.get("/user/:userId", async (req, res) => {
    try {
        const userId = req.params.userId

        const boards = await Board.find({
            $or: [
                { createdBy: userId },
                { sharedWith: userId }
            ]
        })
        res.status(200).json(boards)
    }
    catch (err) {
        res.status(500).json({
            message: "Error fetching boards for the user",
            error: err,
        });
    }
})

router.post("/:boardId/thumbnail", upload.single("image"), async (req, res) => {
    const { boardId } = req.params;
    const { image } = req.body;

    try {
        const compressedImage = await compressImage(image.split(",")[1])
        const thumbnailUrl = saveImageToStorage(compressedImage, boardId);
        await Board.findByIdAndUpdate(boardId, { thumbnail: thumbnailUrl });

        res.status(200).json({ thumbnailUrl });
    } catch (err) {
        console.error("Error saving thumbnail:", err);
        res.status(500).json({ error: "Failed to save thumbnail" });
    }
});


export default router;