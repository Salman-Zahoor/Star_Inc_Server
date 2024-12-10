import { Request } from "express";

declare global {
    namespace Express {
        interface Request {
            userId?: number; // Define userId property on Request interface
        }
    }
}
