import dotenv from "dotenv";
dotenv.config();

export const Secret = process.env.SECRET;
export const user = "admin";
export const password = process.env.PASSWORD;
export const connectString = "db20220722165842_low"; //Connection String for oracle cloud database ver 19c
