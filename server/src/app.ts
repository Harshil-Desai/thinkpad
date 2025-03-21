import express from "express";
import cors from "cors";
import dotenv from "dotenv"
import http from "http"
import connectDB from "./config/database";
import userRoutes from "./routes/userRoutes"
import boardRoutes from "./routes/boardRoutes"
import path from "path";


const fs = require("fs")
dotenv.config()
connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.get("/healthcheck", (req, res) => {
    res.send("Hello World")
})

app.use("/api/users", userRoutes)
app.use("/api/boards", boardRoutes)

const server = http.createServer(app)

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: any) => {
    ws.on('message', (message: any) => {
        wss.clients.forEach((client: any) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });
});

export const saveImageToStorage = (base64Data: string, boardId: string) => {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `thumbnail_${boardId}.png`;
    const filePath = path.join(uploadPath, fileName);

    // Remove the base64 prefix
    const base64Image = base64Data.split(';base64,').pop();
    fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });

    return `../../uploads/${fileName}`;
};


export { server };