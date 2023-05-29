"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectString = exports.password = exports.user = exports.Secret = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.Secret = process.env.SECRET;
exports.user = "admin";
exports.password = process.env.PASSWORD;
exports.connectString = "db20220722165842_low";
//# sourceMappingURL=db.js.map