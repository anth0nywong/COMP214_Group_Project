"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const flights_1 = require("../controllers/flights");
router.post('/flights', flights_1.DisplayFlightsPage);
router.get('/select/:class/:flightId', flights_1.DisplaySelectPage);
router.get('/book/:ticketId', flights_1.AddToCart);
router.get('/checkout', flights_1.DisplayCheckoutTable);
router.get('/cancel/:ticketId', flights_1.RemoveFromCart);
router.get('/confirm', flights_1.Checkout);
exports.default = router;
//# sourceMappingURL=flights.js.map