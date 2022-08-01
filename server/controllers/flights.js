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
exports.Checkout = exports.RemoveFromCart = exports.DisplayCheckoutTable = exports.AddToCart = exports.DisplaySelectPage = exports.DisplayFlightsPage = void 0;
const DBConfig = __importStar(require("../config/db"));
const oracledb_1 = __importDefault(require("oracledb"));
C: /oracle/instantclient_21_6;
let userId = 10;
function DisplayFlightsPage(req, res, next) {
    let fromLocation = "", toLocation = "";
    if (req.body.from.includes("(") && req.body.from.includes(")")) {
        fromLocation = req.body.from.split("(")[1].split(")")[0];
    }
    if (req.body.to.includes("(") && req.body.to.includes(")")) {
        toLocation = req.body.to.split("(")[1].split(")")[0];
    }
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString
    }, async (err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Succesfully Login Oracle Database with user" + DBConfig.user);
        }
        const result = await connection.execute(`
          SELECT * FROM pj_flight
          WHERE TO_CHAR(take_off_time, 'YYYY-MM-DD') = :day AND FROM_AIRPORT = :dep AND TO_AIRPORT = :arr`, {
            day: req.body.date,
            dep: fromLocation,
            arr: toLocation
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
        if (result.rows) {
            for (let i = 0; i < result.rows.length; i++) {
                const minPrice = await connection.execute(`
              BEGIN
              min_price_sp(:flightid, :econ, :business, :first);
              END;`, {
                    flightid: result.rows[i].ID_FLIGHT,
                    econ: { dir: oracledb_1.default.BIND_OUT, type: oracledb_1.default.NUMBER },
                    business: { dir: oracledb_1.default.BIND_OUT, type: oracledb_1.default.NUMBER },
                    first: { dir: oracledb_1.default.BIND_OUT, type: oracledb_1.default.NUMBER }
                });
                result.rows[i].ECON = minPrice.outBinds.econ;
                result.rows[i].BUSINESS = minPrice.outBinds.business;
                result.rows[i].FIRST = minPrice.outBinds.first;
            }
            res.render('index', { title: 'Search', page: 'flight-search', results: result, date: req.body.date, basket: basket, user: user });
            await connection.close();
        }
    });
}
exports.DisplayFlightsPage = DisplayFlightsPage;
function DisplaySelectPage(req, res, next) {
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString
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
            flightid: req.params.flightId
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        const ticket = await connection.execute(`
      SELECT * FROM pj_ticket
      WHERE availability = 'Y' AND class = :class AND flightid = :flightid`, {
            flightid: req.params.flightId,
            class: req.params.class
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        const user = await connection.execute(`
          SELECT * FROM PJ_CUSTOMERS WHERE id_user = :userNum`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        console.log(ticket);
        const basket = await connection.execute(`
          SELECT COUNT(t.id_ticket) COUNT FROM pj_customers c ,pj_orders o, pj_ticket t
            WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND c.id_user = :userNum AND o.completed = 'N'`, {
            userNum: userId,
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        await connection.close();
        res.render('index', { title: 'Select Ticket', flight: flight, page: 'select', ticket: ticket, basket: basket, user: user, flight_id: req.params.flightId });
    });
}
exports.DisplaySelectPage = DisplaySelectPage;
function AddToCart(req, res, next) {
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString
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
            ticketNum: req.params.ticketId
        });
        await connection.close();
        res.redirect('back');
    });
}
exports.AddToCart = AddToCart;
function DisplayCheckoutTable(req, res, next) {
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString
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
      SELECT * FROM pj_customers c ,pj_orders o, pj_ticket t, pj_flight f
      WHERE c.id_user = o.id_user AND o.id_booking = t.orderid AND t.flightid = f.id_flight AND c.id_user = :userNum AND o.completed = 'N'
      `, {
            userNum: userId
        }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
        await connection.close();
        res.render('index', { title: 'Check Out', page: 'checkout', ticket: ticket, basket: basket, user: user });
    });
}
exports.DisplayCheckoutTable = DisplayCheckoutTable;
function RemoveFromCart(req, res, next) {
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString
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
            ticketNum: req.params.ticketId
        });
        await connection.close();
        res.redirect('back');
    });
}
exports.RemoveFromCart = RemoveFromCart;
function Checkout(req, res, next) {
    oracledb_1.default.getConnection({
        user: DBConfig.user,
        password: DBConfig.password,
        connectString: DBConfig.connectString
    }, async (err, connection) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Succesfully Login Oracle Database with user" + DBConfig.user);
        }
        await connection.execute(`
        BEGIN
        checkout_sp(:userNum);
        END;`, {
            userNum: userId,
        });
        await connection.close();
        res.redirect('/home');
    });
}
exports.Checkout = Checkout;
//# sourceMappingURL=flights.js.map