import { useState, useEffect } from "react";
import { Editor } from "@tldraw/tldraw";

const useWhiteboard = () => {
    const [currentTool, setCurrentTool] = useState('pen');
    const [currentColor, setCurrentColor] = useState('#ffffff')

    const selectColor = (color: string) => {
        setCurrentColor(color)
    }

    const selectTool = (tool: string) => {
        setCurrentTool(tool)
    }

    return {
        currentTool,
        currentColor,
        selectTool,
        selectColor
    }
};

export default useWhiteboard;