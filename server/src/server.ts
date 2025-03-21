import { server } from "./app";

const PORT: number = 5000;

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})