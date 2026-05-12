import express from "express";
import cors from "cors";
import dotenv from "dotenv"
import http from "http"
import connectDB from "./config/database";
import userRoutes from "./routes/userRoutes"
import boardRoutes from "./routes/boardRoutes"
import path from "path";
import fs from "fs";

dotenv.config()
connectDB();

const app = express();
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.get("/health", (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
})

app.use("/api/users", userRoutes)
app.use("/api/boards", boardRoutes)

const server = http.createServer(app)

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

// Room-based isolation: boardId → Set<WebSocket>
const rooms = new Map<string, Set<any>>();

wss.on('connection', (ws: any) => {
    ws.boardId = null as string | null;

    ws.on('message', (message: any) => {
        try {
            const data = JSON.parse(message.toString());
            const { boardId } = data;

            if (!boardId) return;

            // If this is the client's first message or boardId changed, update room membership
            if (ws.boardId !== boardId) {
                // Remove from old room if any
                if (ws.boardId && rooms.has(ws.boardId)) {
                    rooms.get(ws.boardId)!.delete(ws);
                    if (rooms.get(ws.boardId)!.size === 0) {
                        rooms.delete(ws.boardId);
                    }
                }
                // Join new room
                if (!rooms.has(boardId)) {
                    rooms.set(boardId, new Set());
                }
                rooms.get(boardId)!.add(ws);
                ws.boardId = boardId;
            }

            // Broadcast only to clients in the same room
            const room = rooms.get(boardId);
            if (room) {
                room.forEach((client: any) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(message.toString());
                    }
                });
            }
        } catch (err) {
            console.error('WebSocket message parse error:', err);
        }
    });

    ws.on('close', () => {
        if (ws.boardId && rooms.has(ws.boardId)) {
            rooms.get(ws.boardId)!.delete(ws);
            if (rooms.get(ws.boardId)!.size === 0) {
                rooms.delete(ws.boardId);
            }
        }
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
    if (!base64Image) {
        throw new Error('Invalid base64 data: could not extract image content');
    }
    fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });

    return `/uploads/${fileName}`;
};

// In production, serve the Vite-built client assets
if (process.env.NODE_ENV === 'production') {
    const clientBuild = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientBuild));
    // Catch-all: return index.html for client-side routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuild, 'index.html'));
    });
}

export { server };