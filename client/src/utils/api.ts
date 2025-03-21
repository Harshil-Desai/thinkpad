import axios from "axios"

const API_BASE_URL = "http://localhost:5000"

export const saveWhiteboardState = async (state: any) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/boards`, state)
        return response.data
    }
    catch (err) {
        console.error('Error saving whiteboard state:', err);
        throw err;
    }
}

export const loadWhiteboardState = async (id: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/boards/${id}`);
        return response.data;
    }
    catch (err) {
        console.error('Error loading whiteboard state:', err);
        throw err;
    }
}