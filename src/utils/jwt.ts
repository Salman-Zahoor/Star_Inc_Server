import jwt from "jsonwebtoken";

const secretKey = "asdasd"; // Replace with your secret key

export const generateToken = (userId: number): string => {
    return jwt.sign({ userId }, secretKey, { expiresIn: "1h" });
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, secretKey);
};
