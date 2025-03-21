import React, { createContext, ReactNode, useContext, useState } from "react";

interface WhiteboardContextProps {
    currentTool: string;
    setCurrentTool: (tool: string) => void;
    currentColor: string;
    setCurrentColor: (color: string) => void;
}

interface WhiteboardProviderProps {
    children: ReactNode;
}

export const WhiteboardContext = createContext<WhiteboardContextProps | undefined>(undefined)

export const WhiteboardProvider: React.FC<WhiteboardProviderProps> = ({ children }) => {
    const [currentColor, setCurrentColor] = useState('black')
    const [currentTool, setCurrentTool] = useState('hand')
    return (
        <WhiteboardContext.Provider value={{ currentTool, currentColor, setCurrentColor, setCurrentTool }}>
            {children}
        </WhiteboardContext.Provider >
    )
}

export const useWhiteboard = () => {
    const context = useContext(WhiteboardContext);
    if (!context) {
        throw new Error('useWhiteboard must be used within a WhiteboardProvider');
    }
    return context;
};