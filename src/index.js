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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
// import { parseHTML } from "linkedom";
var cheerio = require("cheerio");
var feed_1 = require("feed");
var fs = require("fs");
function getShoes(size) {
    return __awaiter(this, void 0, void 0, function () {
        var api, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    api = "https://www.rivers.com.au/rivers-footwear-mens-footwear?prefn1=size&prefv1=".concat(size, "&srule=sorting-CategoryPosition-Rivers-First&start=0&sz=1000");
                    return [4 /*yield*/, fetch(api)];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.text()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function parsePage(html) {
    var shoes = [];
    var $ = cheerio.load(html);
    var rows = $(".product");
    rows.each(function (_, row) {
        var id = $(row).attr("data-pid");
        var name = $(row)
            .find(".pdp-link")
            .text()
            .replace(/[^a-zA-Z0-9 ]/g, "");
        var link = "https://www.rivers.com.au" + $(row).find(".data-gtm").attr("href");
        var price = Number($(row).find(".sales > .value").attr("content"));
        var originalPrice = Number($(row).find(".strike-through > .value").attr("content"));
        shoes.push({
            id: id,
            name: name,
            link: link,
            price: price,
            originalPrice: originalPrice,
            date: new Date(),
        });
    });
    return shoes;
}
function createFeed(pageJson) {
    var feed = new feed_1.Feed({
        title: "Rivers API",
        description: "Rivers promotions",
        link: "https://www.rivers.com.au",
        updated: new Date(),
        id: "",
        copyright: "",
    });
    pageJson.forEach(function (shoe) {
        feed.addItem({
            title: shoe.name,
            link: shoe.link,
            description: "New deal Price:".concat(shoe.price, " Original:").concat(shoe.originalPrice),
            date: shoe.date,
        });
    });
    return feed;
}
function writeJsonToFile(inShoes, outFile) {
    fs.writeFile(outFile, JSON.stringify(inShoes), function () {
        console.log(outFile, "File written");
    });
}
function writeFeedToFile(feed) {
    fs.writeFile("rss.xml", feed, function () {
        console.log("Feed written");
    });
}
function compareToPrevious(previous, current) {
    return current.filter(function (currentShoe) {
        return !previous.some(function (previousShoe) {
            return currentShoe.id === previousShoe.id;
        });
    });
}
function filterToDiscounts(shoes) {
    return shoes.filter(function (shoe) {
        return shoe.price < shoe.originalPrice;
    });
}
function appendToJSON(shoes, changes) {
    return __spreadArray(__spreadArray([], shoes, true), changes, true);
}
function buildRss() {
    return __awaiter(this, void 0, void 0, function () {
        var html, pageJson, discountedShoes, previousFile, changedObjects, forFeed, feedJSON, feed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getShoes(11)];
                case 1:
                    html = _a.sent();
                    pageJson = parsePage(html);
                    discountedShoes = filterToDiscounts(pageJson);
                    previousFile = fs.readFileSync("data/previous.json", "utf8");
                    changedObjects = compareToPrevious(JSON.parse(previousFile), discountedShoes);
                    if (changedObjects.length > 0) {
                        forFeed = fs.readFileSync("data/forFeed.json", "utf8");
                        feedJSON = appendToJSON(JSON.parse(forFeed), changedObjects);
                        writeJsonToFile(discountedShoes, "data/previous.json");
                        writeJsonToFile(feedJSON, "data/forFeed.json");
                        console.log("changed", changedObjects);
                        feed = createFeed(feedJSON);
                        writeFeedToFile(feed.rss2());
                    }
                    else {
                        console.log("Nothing new");
                    }
                    return [2 /*return*/];
            }
        });
    });
}
buildRss();
