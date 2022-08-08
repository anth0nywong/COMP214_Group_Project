import express, { NextFunction } from 'express';
const router = express.Router();

import { DisplayFlightsPage, DisplaySelectPage, AddToCart, DisplayCheckoutTable, RemoveFromCart, Checkout } from "../controllers/flights";

/* Display home page. */
router.post('/flights',  DisplayFlightsPage);

router.get('/select/:class/:flightId', DisplaySelectPage);

router.get('/book/:ticketId', AddToCart);

router.get('/checkout', DisplayCheckoutTable);

router.get('/cancel/:ticketId', RemoveFromCart);

router.get('/confirm', Checkout);

export default router;
