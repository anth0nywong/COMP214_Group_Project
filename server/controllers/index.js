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
exports.DisplayHomePage = void 0;
const DBConfig = __importStar(require("../Config/db"));
const oracledb_1 = __importDefault(require("oracledb"));
let userId = 10;
function DisplayHomePage(req, res, next) {
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
        res.render('index', { title: 'Home', page: 'home', basket: basket, user: user });
        await connection.close();
    });
}
exports.DisplayHomePage = DisplayHomePage;
//# sourceMappingURL=index.js.map