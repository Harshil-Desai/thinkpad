import express from "express"
import User from "../models/User";
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt"
import rateLimit from 'express-rate-limit'

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = express.Router()

router.get('/test', (req, res) => {
    res.send('Test route is working');
});

router.post('/register', authLimiter, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({
            username: username,
            email: email,
            password: password
        })
        await user.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, { expiresIn: '1d' })
        res.status(201).json({
            message: "User created successfully",
            user: user,
            token,
            userId: user._id
        })
    } catch (error) {
        res.status(500).json({ message: `Something wend wrong: ${error}` })
    }
})

router.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) res.status(404).json({ message: "User not found" })
        else {
            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) res.status(400).json({ message: "Invalid credentials" });
            else {
                const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, { expiresIn: '1d' })
                res.status(200).json({ token, user })
            }
        }
    }
    catch (err) {
        res.status(500).json({ message: "Something went wrong", error: err })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) res.status(404).json({ message: "User not found" })
        else {
            res.status(200).json(user)
        }
    }
    catch (err) {
        res.status(500).json({ message: "Something went wrong", error: err })
    }
})

router.post("/usernames", async (req, res) => {
    const { userIds } = req.body;
    try {
        const users = await User.find({ _id: { $in: userIds } }, { username: 1 });
        const usernames = users.map((user) => user.username);
        res.status(200).json({ usernames });
    } catch (err) {
        console.error("Error fetching usernames:", err);
        res.status(500).json({ error: "Failed to fetch usernames" });
    }
});

export default router;