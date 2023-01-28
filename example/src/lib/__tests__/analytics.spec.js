"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
var analytics_1 = require("../analytics");
var GeneralAlertId = analytics_1.BotAnalytics.GeneralAlertId;
describe('BotAnalytics', function () {
    var _a;
    var mockAnalytics;
    var mockPersistence = {
        load: jest.fn(),
        save: jest.fn(),
    };
    var defaultConfigValues = {
        defaultAnomalyScore: (_a = {}, _a[GeneralAlertId] = 0.25, _a),
        observableInterval: 24 * 60 * 60,
        syncTimeout: 30 * 60,
        maxSyncDelay: 2 * 24 * 60 * 60,
    };
    var getBotKey = function (key) { return analytics_1.BotAnalytics.StorageKey + '/' + key; };
    beforeEach(function () {
        mockAnalytics = new analytics_1.BotAnalytics(mockPersistence, defaultConfigValues);
        mockPersistence.load.mockClear();
        mockPersistence.save.mockClear();
    });
    it('uses default score if sync data is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
        var score;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockPersistence.load.mockResolvedValue(null);
                    return [4 /*yield*/, mockAnalytics.sync(0)];
                case 1:
                    _a.sent();
                    score = mockAnalytics.getAnomalyScore();
                    expect(score).toStrictEqual(defaultConfigValues.defaultAnomalyScore[GeneralAlertId]);
                    expect(mockPersistence.load).toBeCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('uses default score if observation of sync data is not long enough', function () { return __awaiter(void 0, void 0, void 0, function () {
        var observationStartTimestamp, observationEndTimestamp, score;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    observationStartTimestamp = 1000;
                    observationEndTimestamp = observationStartTimestamp + defaultConfigValues.observableInterval - 1;
                    mockPersistence.load.mockResolvedValue({
                        alertTriggers: (_a = {}, _a[GeneralAlertId] = 1, _a),
                        botTriggers: (_b = {}, _b[GeneralAlertId] = 100, _b),
                        startTimestamp: observationStartTimestamp,
                        endTimestamp: observationEndTimestamp,
                    });
                    return [4 /*yield*/, mockAnalytics.sync(observationEndTimestamp + 1)];
                case 1:
                    _c.sent();
                    score = mockAnalytics.getAnomalyScore();
                    expect(score).toStrictEqual(defaultConfigValues.defaultAnomalyScore[GeneralAlertId]);
                    expect(mockPersistence.load).toBeCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('uses default score if sync data is outdated', function () { return __awaiter(void 0, void 0, void 0, function () {
        var syncDataStartTimestamp, syncDataEndTimestamp, localTimestamp, score;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    syncDataStartTimestamp = 1000;
                    syncDataEndTimestamp = syncDataStartTimestamp + defaultConfigValues.observableInterval;
                    mockPersistence.load.mockResolvedValue({
                        alertTriggers: (_a = {}, _a[GeneralAlertId] = 1, _a),
                        botTriggers: (_b = {}, _b[GeneralAlertId] = 100, _b),
                        startTimestamp: syncDataStartTimestamp,
                        endTimestamp: syncDataEndTimestamp,
                    });
                    localTimestamp = syncDataEndTimestamp + defaultConfigValues.maxSyncDelay + 1;
                    return [4 /*yield*/, mockAnalytics.sync(localTimestamp)];
                case 1:
                    _c.sent();
                    score = mockAnalytics.getAnomalyScore();
                    expect(score).toStrictEqual(defaultConfigValues.defaultAnomalyScore[GeneralAlertId]);
                    expect(mockPersistence.load).toBeCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('uses default scores properly', function () { return __awaiter(void 0, void 0, void 0, function () {
        var score;
        var _a;
        return __generator(this, function (_b) {
            mockAnalytics = new analytics_1.BotAnalytics(mockPersistence, __assign(__assign({}, defaultConfigValues), { defaultAnomalyScore: (_a = {},
                    _a[GeneralAlertId] = 0.4,
                    _a['alert-1'] = 0.24,
                    _a) }));
            score = mockAnalytics.getAnomalyScore();
            expect(score).toStrictEqual(0.4);
            score = mockAnalytics.getAnomalyScore('alert-1');
            expect(score).toStrictEqual(0.24);
            return [2 /*return*/];
        });
    }); });
    it('uses sync data if observation of local data is not long enough', function () { return __awaiter(void 0, void 0, void 0, function () {
        var syncDataStartTimestamp, syncDataEndTimestamp, localModeStartTimestamp, localModeEndTimestamp, score;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    syncDataStartTimestamp = 1000;
                    syncDataEndTimestamp = syncDataStartTimestamp + defaultConfigValues.observableInterval;
                    mockPersistence.load.mockResolvedValue({
                        alertTriggers: (_a = {}, _a[GeneralAlertId] = 1, _a),
                        botTriggers: (_b = {}, _b[GeneralAlertId] = 100, _b),
                        startTimestamp: syncDataStartTimestamp,
                        endTimestamp: syncDataEndTimestamp,
                    });
                    // fetch sync data
                    return [4 /*yield*/, mockAnalytics.sync(syncDataEndTimestamp)];
                case 1:
                    // fetch sync data
                    _e.sent();
                    mockPersistence.load.mockResolvedValue({
                        alertTriggers: (_c = {}, _c[GeneralAlertId] = 1, _c),
                        botTriggers: (_d = {}, _d[GeneralAlertId] = 10, _d),
                        startTimestamp: syncDataStartTimestamp,
                        endTimestamp: syncDataEndTimestamp,
                    });
                    // refetch sync data
                    return [4 /*yield*/, mockAnalytics.sync(syncDataEndTimestamp + defaultConfigValues.syncTimeout)];
                case 2:
                    // refetch sync data
                    _e.sent();
                    localModeStartTimestamp = syncDataEndTimestamp + defaultConfigValues.syncTimeout + 1;
                    localModeEndTimestamp = syncDataEndTimestamp + defaultConfigValues.observableInterval - 1;
                    // observation period is less than the required one
                    mockAnalytics.incrementBotTriggers(localModeStartTimestamp);
                    mockAnalytics.incrementBotTriggers(localModeEndTimestamp);
                    mockAnalytics.incrementAlertTriggers(localModeEndTimestamp);
                    score = mockAnalytics.getAnomalyScore();
                    expect(score).toStrictEqual(1 / 10);
                    expect(mockPersistence.load).toBeCalled();
                    expect(mockPersistence.save).not.toBeCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws an error if there is no default value', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            mockAnalytics = new analytics_1.BotAnalytics(mockPersistence, __assign(__assign({}, defaultConfigValues), { defaultAnomalyScore: {} }));
            expect(function () { return mockAnalytics.getAnomalyScore(); }).toThrow();
            expect(function () { return mockAnalytics.getAnomalyScore('unknown'); }).toThrow();
            return [2 /*return*/];
        });
    }); });
    it('uses default score if there is trigger imbalance in sync data', function () { return __awaiter(void 0, void 0, void 0, function () {
        var defaultAnomalyScore;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    defaultAnomalyScore = (_a = {},
                        _a[GeneralAlertId] = 0.24,
                        _a['alert-1'] = 0.2,
                        _a);
                    mockAnalytics = new analytics_1.BotAnalytics(mockPersistence, __assign(__assign({}, defaultConfigValues), { defaultAnomalyScore: defaultAnomalyScore }));
                    mockPersistence.load.mockResolvedValue({
                        alertTriggers: (_b = {}, _b[GeneralAlertId] = 2, _b['alert-1'] = 1, _b),
                        botTriggers: (_c = {}, _c[GeneralAlertId] = 1, _c),
                        startTimestamp: 0,
                        endTimestamp: defaultConfigValues.observableInterval,
                    });
                    return [4 /*yield*/, mockAnalytics.sync(defaultConfigValues.observableInterval)];
                case 1:
                    _d.sent();
                    expect(mockAnalytics.getAnomalyScore()).toStrictEqual(defaultAnomalyScore[GeneralAlertId]);
                    expect(mockAnalytics.getAnomalyScore('alert-1')).toStrictEqual(defaultAnomalyScore['alert-1']);
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws an error if there is trigger imbalance in local data', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // local data
                    mockAnalytics.incrementBotTriggers(0);
                    mockAnalytics.incrementAlertTriggers(0);
                    mockAnalytics.incrementAlertTriggers(0, 'alert-2');
                    mockAnalytics.incrementAlertTriggers(defaultConfigValues.observableInterval);
                    expect(function () { return mockAnalytics.getAnomalyScore(); }).toThrow();
                    expect(function () { return mockAnalytics.getAnomalyScore('alert-2'); }).toThrow();
                    return [4 /*yield*/, expect(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, mockAnalytics.sync(defaultConfigValues.observableInterval)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }).rejects.toThrow()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('calculates anomaly score / sync data', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    mockPersistence.load.mockResolvedValue({
                        alertTriggers: (_a = {}, _a[GeneralAlertId] = 1, _a['alert-1'] = 1, _a),
                        botTriggers: (_b = {}, _b[GeneralAlertId] = 100, _b['alert-1'] = 4, _b),
                        startTimestamp: 0,
                        endTimestamp: defaultConfigValues.observableInterval,
                    });
                    return [4 /*yield*/, mockAnalytics.sync(defaultConfigValues.observableInterval)];
                case 1:
                    _c.sent();
                    expect(mockAnalytics.getAnomalyScore()).toStrictEqual(1 / 100);
                    expect(mockAnalytics.getAnomalyScore('alert-1')).toStrictEqual(1 / 4);
                    return [2 /*return*/];
            }
        });
    }); });
    it('calculates anomaly score / local data', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            mockAnalytics.incrementBotTriggers(0);
            mockAnalytics.incrementAlertTriggers(defaultConfigValues.observableInterval);
            mockAnalytics.incrementBotTriggers(defaultConfigValues.observableInterval);
            mockAnalytics.incrementBotTriggers(0, 'alert-1');
            mockAnalytics.incrementBotTriggers(1, 'alert-1');
            mockAnalytics.incrementBotTriggers(2, 'alert-1');
            mockAnalytics.incrementAlertTriggers(defaultConfigValues.observableInterval, 'alert-1');
            mockAnalytics.incrementBotTriggers(defaultConfigValues.observableInterval, 'alert-1');
            expect(mockAnalytics.getAnomalyScore()).toStrictEqual(1 / 2);
            expect(mockAnalytics.getAnomalyScore('alert-1')).toStrictEqual(1 / 4);
            mockAnalytics.incrementBotTriggers(defaultConfigValues.observableInterval * 2);
            expect(mockAnalytics.getAnomalyScore()).toStrictEqual(1 / 2);
            return [2 /*return*/];
        });
    }); });
    it('uploads sync data if observation period of local data is long enough', function () { return __awaiter(void 0, void 0, void 0, function () {
        var startTimestamp, endTimestamp;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    startTimestamp = 100;
                    endTimestamp = startTimestamp + defaultConfigValues.observableInterval;
                    mockAnalytics.incrementBotTriggers(startTimestamp);
                    mockAnalytics.incrementBotTriggers(endTimestamp);
                    mockAnalytics.incrementAlertTriggers(endTimestamp);
                    mockPersistence.load.mockResolvedValue(null);
                    mockPersistence.save.mockResolvedValue();
                    return [4 /*yield*/, mockAnalytics.sync(endTimestamp)];
                case 1:
                    _c.sent();
                    expect(mockPersistence.save).toBeCalledWith(getBotKey(''), {
                        startTimestamp: startTimestamp,
                        endTimestamp: endTimestamp,
                        botTriggers: (_a = {}, _a[GeneralAlertId] = 2, _a),
                        alertTriggers: (_b = {}, _b[GeneralAlertId] = 1, _b),
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it("doesn't upload sync data if previous update was recent", function () { return __awaiter(void 0, void 0, void 0, function () {
        var startTimestamp, lastTimestamp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTimestamp = 100;
                    lastTimestamp = startTimestamp + defaultConfigValues.observableInterval;
                    mockAnalytics.incrementBotTriggers(startTimestamp);
                    mockAnalytics.incrementBotTriggers(lastTimestamp);
                    mockAnalytics.incrementAlertTriggers(lastTimestamp);
                    return [4 /*yield*/, mockAnalytics.sync(lastTimestamp)];
                case 1:
                    _a.sent();
                    expect(mockPersistence.save).toBeCalled();
                    mockPersistence.save.mockReset();
                    return [4 /*yield*/, mockAnalytics.sync(lastTimestamp + defaultConfigValues.syncTimeout - 1)];
                case 2:
                    _a.sent();
                    expect(mockPersistence.save).not.toBeCalled();
                    mockAnalytics.incrementBotTriggers(lastTimestamp + defaultConfigValues.syncTimeout);
                    return [4 /*yield*/, mockAnalytics.sync(lastTimestamp + defaultConfigValues.syncTimeout)];
                case 3:
                    _a.sent();
                    expect(mockPersistence.save).toBeCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it("doesn't upload sync data if local data has no any value", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockAnalytics.incrementBotTriggers(0);
                    mockAnalytics.incrementBotTriggers(defaultConfigValues.observableInterval);
                    mockAnalytics.incrementAlertTriggers(defaultConfigValues.observableInterval);
                    // we should remove all previous triggers that are not in the observable interval
                    return [4 /*yield*/, mockAnalytics.sync(defaultConfigValues.observableInterval * 2 + 1)];
                case 1:
                    // we should remove all previous triggers that are not in the observable interval
                    _a.sent();
                    expect(mockPersistence.save).not.toBeCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('uploads correct sync data when observation period is longer than "observableInterval"', function () { return __awaiter(void 0, void 0, void 0, function () {
        var startTimestamp, lastTimestamp;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    startTimestamp = 100;
                    lastTimestamp = startTimestamp + defaultConfigValues.observableInterval;
                    return [4 /*yield*/, mockAnalytics.incrementBotTriggers(startTimestamp)];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, mockAnalytics.incrementBotTriggers(startTimestamp + 1)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, mockAnalytics.incrementAlertTriggers(startTimestamp + 1)];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, mockAnalytics.incrementBotTriggers(lastTimestamp)];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, mockAnalytics.incrementAlertTriggers(lastTimestamp)];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, mockAnalytics.sync(lastTimestamp + 1)];
                case 6:
                    _c.sent();
                    expect(mockPersistence.save).toBeCalledWith(getBotKey(''), {
                        startTimestamp: startTimestamp + 1,
                        endTimestamp: lastTimestamp + 1,
                        botTriggers: (_a = {}, _a[GeneralAlertId] = 2, _a),
                        alertTriggers: (_b = {}, _b[GeneralAlertId] = 2, _b),
                    });
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=analytics.spec.js.map