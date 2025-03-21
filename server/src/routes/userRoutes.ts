import express from "express"
import User from "../models/User";
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt"

const router = express.Router()

router.get('/test', (req, res) => {
    res.send('Test route is working');
});

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({
            username: username,
            email: email,
            password: password
        })
        await user.save()
        res.status(201).json({
            message: "User created successfully",
            user: user
        })
    } catch (error) {
        res.status(500).json({ message: `Something wend wrong: ${error}` })
    }
})

router.post('/login', async (req, res) => {
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