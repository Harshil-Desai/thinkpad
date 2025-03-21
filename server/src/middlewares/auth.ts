import jwt from "jsonwebtoken"
import User from "../models/User"

export const authenticate = async (req: any, res: any, next: any) => {
    const token = req.header('Authorization')?.replace("Bearer ", "");
    if (!token) res.status(401).json({ message: "no token, auth denied" })
    else {
        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string)
            req.user = await User.findById(decoded.id).select("-password")
            next()
        }
        catch {
            res.status(401).json({ message: "Token is not valid" });
        }
    }
}