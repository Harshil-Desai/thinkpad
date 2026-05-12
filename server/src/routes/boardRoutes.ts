import express from "express"
import multer from "multer"
import Board from "../models/Board"
import User from "../models/User";
import path from "path";
import { saveImageToStorage } from "../app";
import { error } from "console";
import sharp from "sharp";
import { compressImage } from "../utils/utils";
import { authenticate } from "../middlewares/auth";

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

router.post("/", authenticate, async (req: any, res) => {
    try {
        const boardData = { ...req.body, createdBy: req.user._id };
        const board = await Board.create(boardData)
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

router.get("/", authenticate, async (req: any, res) => {
    try {
        const userId = req.user._id;
        const boards = await Board.find({
            $or: [
                { createdBy: userId },
                { sharedWith: userId }
            ]
        });
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
        const board = await Board.findById(req.params.id).populate('sharedWith', 'username')
        if (!board) {
            return res.status(404).json({
                message: "Board not found"
            })
        }
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

router.delete("/:id", authenticate, async (req: any, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ message: "Board not found" })
        }
        if (board.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Forbidden: you do not own this board" })
        }
        await Board.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Board deleted successfully" })
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
            return res.status(404).json({
                message: "Board not found"
            })
        }

        const users = await User.find({ email: { $in: sharedWith } }, '_id')
        const userIds = users.map((e) => e._id)

        for (const userId of userIds) {
            if (!board.sharedWith.includes(userId as any)) {
                board.sharedWith.push(userId as any);
            }
        }
        await board.save()

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