"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckFlight = exports.CheckBooking = exports.Checkout = exports.RemoveFromCart = exports.DisplayCheckoutTable = exports.AddToCart = exports.DisplaySelectPage = exports.DisplayFlightsPage = void 0;
const DBConfig = __importStar(require("../config/db"));
const oracledb_1 = __importDefault(require("oracledb"));
let userId = 10;
function DisplayFlightsPage(req, res, next) {
    let fromLocation = "", toLocation = "";
    if (req.body.from.includes("(") && req.body.from.includes(")")) {
        fromLocation = req.body.from.split("(")[1].split(")")[0];
    }
    else
        fromLocation = req.body.from;
    if (req.body.to.includes("(") && req.body.to.includes(")")) {
        toLocation = req.body.to.split("(")[1].split(")")[0];
    }
    else
        toLocation = req.body.to;
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString,
    }, async (err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Succesfully Login Oracle Database with user" + DBConfig.user);
        }
        const result = await connection.execute(`SELECT * FROM pj_flight
          WHERE TO_CHAR(take_off_time, 'YYYY-MM-DD') = :day AND FROM_AIRPORT = :dep AND TO_AIRPORT = :arr`, {
            day: req.body.date,
            dep: fromLocation,
            arr: toLocation,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        const user = await connection.execute(`
          SELECT * FROM PJ_CUSTOMERS WHERE id_user = :userNum`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        const basket = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        if (basket.rows && basket.rows[0].COUNT == 0) {
            await connection.execute(`BEGIN
              create_empty_basket_sp(:userNum);
              END;
              `, {
                userNum: userId,
            });
        }
        if (result.rows) {
            for (let i = 0; i < result.rows.length; i++) {
                const minPrice = await connection.execute(`BEGIN
              min_price_sp(:flightid, :econ, :business, :first);
              END;`, {
                    flightid: result.rows[i].ID_FLIGHT,
                    econ: { dir: oracledb_1.default.BIND_OUT, type: oracledb_1.default.NUMBER },
                    business: { dir: oracledb_1.default.BIND_OUT, type: oracledb_1.default.NUMBER },
                    first: { dir: oracledb_1.default.BIND_OUT, type: oracledb_1.default.NUMBER },
                });
                const econ = await connection.execute(`
              SELECT COUNT(s.id_ticket) NUM FROM TABLE (check_seat(:flightid)) s , pj_ticket p where s.id_ticket = p.id_ticket AND p.class = 'Economy'`, {
                    flightid: result.rows[i].ID_FLIGHT,
                }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
                const business = await connection.execute(`
              SELECT COUNT(s.id_ticket) NUM FROM TABLE (check_seat(:flightid)) s , pj_ticket p where s.id_ticket = p.id_ticket AND p.class = 'Business'`, {
                    flightid: result.rows[i].ID_FLIGHT,
                }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
                const first = await connection.execute(`
              SELECT COUNT(s.id_ticket) NUM FROM TABLE (check_seat(:flightid)) s , pj_ticket p where s.id_ticket = p.id_ticket AND p.class = 'First'`, {
                    flightid: result.rows[i].ID_FLIGHT,
                }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
                if (econ.rows) {
                    result.rows[i].availabileEcon = econ.rows[0].NUM;
                }
                else {
                    result.rows[i].availabileEcon = 0;
                }
                if (business.rows) {
                    result.rows[i].availabileBusiness = business.rows[0].NUM;
                }
                else {
                    result.rows[i].availabileBusiness = 0;
                }
                if (first.rows) {
                    result.rows[i].availabileFirst = first.rows[0].NUM;
                }
                else {
                    result.rows[i].availabileFirst = 0;
                }
                result.rows[i].ECON = minPrice.outBinds.econ;
                result.rows[i].BUSINESS = minPrice.outBinds.business;
                result.rows[i].FIRST = minPrice.outBinds.first;
            }
        }
        console.log(result);
        res.render("index", {
            title: "Search",
            page: "flight-search",
            results: result,
            date: req.body.date,
            basket: basket,
            user: user,
            fromLocation: fromLocation,
            toLocation: toLocation,
        });
        await connection.close();
    });
}
exports.DisplayFlightsPage = DisplayFlightsPage;
function DisplaySelectPage(req, res, next) {
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString,
    }, async (err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Succesfully Login Oracle Database with user" + DBConfig.user);
        }
        const flight = await connection.execute(`
      SELECT TO_CHAR(take_off_time, 'YYYY-MM-DD') takeoffdate, airline, id_flight, model FROM pj_flight
      WHERE  id_flight =  :flightid`, {
            flightid: req.params.flightId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        const ticket = await connection.execute(`
      SELECT * FROM pj_ticket
      WHERE availability = 'Y' AND class = :class AND flightid = :flightid AND orderid IS NULL`, {
            flightid: req.params.flightId,
            class: req.params.class,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        const user = await connection.execute(`
          SELECT * FROM PJ_CUSTOMERS WHERE id_user = :userNum`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        const basket = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        await connection.close();
        res.render("index", {
            title: "Select Ticket",
            flight: flight,
            page: "select",
            ticket: ticket,
            basket: basket,
            user: user,
            flight_id: req.params.flightId,
        });
    });
}
exports.DisplaySelectPage = DisplaySelectPage;
function AddToCart(req, res, next) {
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString,
    }, async (err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Succesfully Login Oracle Database with user" + DBConfig.user);
        }
        const basket = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        if (basket.rows && basket.rows[0].COUNT == 0) {
            await connection.execute(`
              BEGIN
              create_empty_basket_sp(:userNum);
              END;
              `, {
                userNum: userId,
            });
        }
        await connection.execute(`
            BEGIN
            add_to_cart_sp(:ticketNum, :userNum);
            END;
            `, {
            userNum: userId,
            ticketNum: req.params.ticketId,
        });
        await connection.close();
        res.redirect("back");
    });
}
exports.AddToCart = AddToCart;
function DisplayCheckoutTable(req, res, next) {
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString,
    }, async (err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Succesfully Login Oracle Database with user" + DBConfig.user);
        }
        const user = await connection.execute(`
          SELECT * FROM PJ_CUSTOMERS WHERE id_user = :userNum`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        const basket = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        if (basket.rows && basket.rows[0].COUNT == 0) {
            await connection.execute(`
              BEGIN
              create_empty_basket_sp(:userNum);
              END;
              `, {
                userNum: userId,
            });
        }
        const ticket = await connection.execute(`
      SELECT cal_tax(o.id_booking) tax_rate, f.airline, t.position,t.id_ticket, f.take_off_time, f.arrival_time, f.from_airport, f.to_airport, t.price FROM pj_customers c ,pj_orders o, pj_ticket t, pj_flight f
      WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND t.flightid = f.id_flight AND c.id_user = :userNum AND o.completed = 'N'
      `, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        await connection.close();
        res.render("index", {
            title: "Check Out",
            page: "checkout",
            ticket: ticket,
            basket: basket,
            user: user,
        });
    });
}
exports.DisplayCheckoutTable = DisplayCheckoutTable;
function RemoveFromCart(req, res, next) {
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString,
    }, async (err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Succesfully Login Oracle Database with user" + DBConfig.user);
        }
        const basket = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        if (basket.rows && basket.rows[0].COUNT == 0) {
            await connection.execute(`
              BEGIN
              create_empty_basket_sp(:userNum);
              END;
              `, {
                userNum: userId,
            });
        }
        await connection.execute(`
            BEGIN
            remove_from_cart_sp(:ticketNum, :userNum);
            END;
            `, {
            userNum: userId,
            ticketNum: req.params.ticketId,
        });
        await connection.close();
        res.redirect("back");
    });
}
exports.RemoveFromCart = RemoveFromCart;
function Checkout(req, res, next) {
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString,
    }, async (err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Succesfully Login Oracle Database with user" + DBConfig.user);
        }
        const ticket = await connection.execute(`
        SELECT * FROM pj_customers c ,pj_orders o, pj_ticket t, pj_flight f
        WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND t.flightid = f.id_flight AND c.id_user = :userNum AND o.completed = 'N'
        `, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        await connection.execute(`
        BEGIN
        checkout_sp(:userNum);
        END;`, {
            userNum: userId,
        });
        const user = await connection.execute(`
          SELECT * FROM PJ_CUSTOMERS WHERE id_user = :userNum`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        const basket = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        await connection.close();
        res.render("index", {
            title: "Check Out",
            page: "complete_order",
            ticket: ticket,
            basket: basket,
            user: user,
        });
    });
}
exports.Checkout = Checkout;
function CheckBooking(req, res, next) {
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString,
    }, async (err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Succesfully Login Oracle Database with user" + DBConfig.user);
        }
        const ticket = await connection.execute(`
        SELECT o.id_booking, t.price, t.id_ticket, t.position, f.airline, t.flightid, f.take_off_time, f.arrival_time, f.from_airport, f.to_airport 
        FROM pj_orders o, pj_ticket t, pj_customers c, pj_flight f
        where o.id_booking = t.orderid
        AND t.flightid = f.id_flight
        AND o.id_user = c.id_user 
        AND LOWER(c.last_name)  = :lastName AND o.id_booking = :idBooking
        `, {
            lastName: req.body.lastName.toLowerCase(),
            idBooking: req.body.idBooking,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        const user = await connection.execute(`
          SELECT * FROM PJ_CUSTOMERS WHERE id_user = :userNum`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        const basket = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        if (basket.rows && basket.rows[0].COUNT == 0) {
            await connection.execute(`
        BEGIN
        create_empty_basket_sp(:userNum);
        END;
        `, {
                userNum: userId,
            });
        }
        await connection.close();
        res.render("index", {
            title: "Check Out",
            page: "booking",
            ticket: ticket,
            basket: basket,
            user: user,
        });
    });
}
exports.CheckBooking = CheckBooking;
function CheckFlight(req, res, next) {
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString,
    }, async (err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Succesfully Login Oracle Database with user" + DBConfig.user);
        }
        console.log(req.body.airline);
        const result = await connection.execute(`
          SELECT * FROM pj_flight where id_flight = :flightid AND airline = :airline`, {
            flightid: req.body.flightid,
            airline: req.body.airline,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        console.log(result);
        const user = await connection.execute(`
          SELECT * FROM PJ_CUSTOMERS WHERE id_user = :userNum`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        const basket = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        if (basket.rows && basket.rows[0].COUNT == 0) {
            await connection.execute(`
              BEGIN
              create_empty_basket_sp(:userNum);
              END;
              `, {
                userNum: userId,
            });
        }
        res.render("index", {
            title: "Search",
            page: "flight-info",
            results: result,
            basket: basket,
            user: user,
        });
        await connection.close();
    });
}
exports.CheckFlight = CheckFlight;
//# sourceMappingURL=flights.js.map