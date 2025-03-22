import { Socket, io } from "socket.io-client";

const URL = process.env.BASE_URL

export const socket: Socket = io(URL, {
    autoConnect: false
})