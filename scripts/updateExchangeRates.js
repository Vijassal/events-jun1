"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
// @ts-ignore
var fetch = require('node-fetch');
var supabase_1 = require("../src/lib/supabase");
var topCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD',
    'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL',
    'TWD', 'DKK', 'PLN', 'THB', 'IDR'
];
var today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
var apiVersion = 'v1';
function fetchRates(base) {
    return __awaiter(this, void 0, void 0, function () {
        var endpoint, primaryUrl, fallbackUrl, res, data, e_1, res, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    endpoint = "currencies/".concat(base.toLowerCase(), ".json");
                    primaryUrl = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/".concat(apiVersion, "/").concat(endpoint);
                    fallbackUrl = "https://latest.currency-api.pages.dev/".concat(apiVersion, "/").concat(endpoint);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 10]);
                    return [4 /*yield*/, fetch(primaryUrl)];
                case 2:
                    res = _a.sent();
                    if (!res.ok)
                        throw new Error('Primary API failed');
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    return [2 /*return*/, data[base.toLowerCase()]];
                case 4:
                    e_1 = _a.sent();
                    console.warn("[".concat(base, "] Primary API failed, trying fallback..."));
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 8, , 9]);
                    return [4 /*yield*/, fetch(fallbackUrl)];
                case 6:
                    res = _a.sent();
                    if (!res.ok)
                        throw new Error('Fallback API failed');
                    return [4 /*yield*/, res.json()];
                case 7:
                    data = _a.sent();
                    return [2 /*return*/, data[base.toLowerCase()]];
                case 8:
                    err_1 = _a.sent();
                    console.error("[".concat(base, "] Both APIs failed."));
                    return [2 /*return*/, null];
                case 9: return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function updateAllRates() {
    return __awaiter(this, void 0, void 0, function () {
        var delError, _loop_1, _i, topCurrencies_1, base, fs, path, tsPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, supabase_1.supabase.from('exchange_rates').delete().neq('from_currency', '')];
                case 1:
                    delError = (_a.sent()).error;
                    if (delError) {
                        console.error('Error deleting all rates:', delError.message);
                    }
                    else {
                        console.log('Deleted all rates from the table.');
                    }
                    _loop_1 = function (base) {
                        var rates, upserts, error;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    console.log("Fetching rates for base: ".concat(base));
                                    return [4 /*yield*/, fetchRates(base)];
                                case 1:
                                    rates = _b.sent();
                                    if (!rates)
                                        return [2 /*return*/, "continue"];
                                    upserts = Object.entries(rates)
                                        .filter(function (_a) {
                                        var to = _a[0];
                                        return topCurrencies.includes(to.toUpperCase()) && to.toUpperCase() !== base;
                                    })
                                        .map(function (_a) {
                                        var to = _a[0], rate = _a[1];
                                        return ({
                                            from_currency: base,
                                            to_currency: to.toUpperCase(),
                                            rate: Number(rate),
                                            date: today,
                                        });
                                    });
                                    if (upserts.length === 0)
                                        return [2 /*return*/, "continue"];
                                    return [4 /*yield*/, supabase_1.supabase.from('exchange_rates').insert(upserts)];
                                case 2:
                                    error = (_b.sent()).error;
                                    if (error) {
                                        console.error("[".concat(base, "] Supabase insert error:"), error.message);
                                    }
                                    else {
                                        console.log("[".concat(base, "] Inserted ").concat(upserts.length, " rates."));
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, topCurrencies_1 = topCurrencies;
                    _a.label = 2;
                case 2:
                    if (!(_i < topCurrencies_1.length)) return [3 /*break*/, 5];
                    base = topCurrencies_1[_i];
                    return [5 /*yield**/, _loop_1(base)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log('Exchange rates update complete.');
                    fs = require('fs');
                    path = require('path');
                    tsPath = path.resolve(require('os').homedir(), 'last_exchange_update.txt');
                    fs.writeFileSync(tsPath, new Date().toISOString(), 'utf8');
                    return [2 /*return*/];
            }
        });
    });
}
updateAllRates().catch(function (e) {
    console.error('Fatal error updating exchange rates:', e);
    process.exit(1);
});
