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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotAnalytics = exports.TriggerType = void 0;
var TriggerType;
(function (TriggerType) {
    TriggerType[TriggerType["Bot"] = 0] = "Bot";
    TriggerType[TriggerType["Alert"] = 1] = "Alert";
})(TriggerType = exports.TriggerType || (exports.TriggerType = {}));
var BotAnalytics = /** @class */ (function () {
    function BotAnalytics(storage, opts) {
        this.triggersByAlertId = new Map();
        this.syncStats = null;
        this.firstLocalTimestamp = -1;
        this.lastLocalTimestamp = -1;
        this.lastSyncTimestamp = -1;
        var defaultAnomalyScore = opts.defaultAnomalyScore, observableInterval = opts.observableInterval, syncTimeout = opts.syncTimeout, maxSyncDelay = opts.maxSyncDelay, key = opts.key, logFn = opts.logFn;
        this.storage = storage;
        this.syncTimeout = syncTimeout;
        this.maxSyncDelay = maxSyncDelay;
        this.observableInterval = observableInterval;
        this.defaultAnomalyScore = defaultAnomalyScore;
        this.botKey = BotAnalytics.StorageKey + '#' + (key || '');
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.log = logFn || (function () { });
    }
    BotAnalytics.prototype.updateLocalTimestamps = function (timestamp) {
        if (this.firstLocalTimestamp === -1 || this.firstLocalTimestamp > timestamp)
            this.firstLocalTimestamp = timestamp;
        if (this.lastLocalTimestamp === -1 || this.lastLocalTimestamp < timestamp)
            this.lastLocalTimestamp = timestamp;
    };
    BotAnalytics.prototype.getLocalStats = function () {
        var e_1, _a, e_2, _b;
        var botTriggers = {};
        var alertTriggers = {};
        try {
            for (var _c = __values(this.triggersByAlertId.keys()), _d = _c.next(); !_d.done; _d = _c.next()) {
                var alertId = _d.value;
                try {
                    for (var _e = (e_2 = void 0, __values(this.triggersByAlertId.get(alertId) || [])), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var type = _f.value.type;
                        if (type === TriggerType.Bot)
                            botTriggers[alertId] = botTriggers[alertId] ? botTriggers[alertId] + 1 : 1;
                        else if (type === TriggerType.Alert)
                            alertTriggers[alertId] = alertTriggers[alertId] ? alertTriggers[alertId] + 1 : 1;
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return {
            startTimestamp: Math.max(0, this.firstLocalTimestamp, this.lastLocalTimestamp - this.observableInterval),
            endTimestamp: Math.max(0, this.lastLocalTimestamp),
            botTriggers: botTriggers,
            alertTriggers: alertTriggers,
        };
    };
    BotAnalytics.prototype.clearOutdatedTriggerRecords = function (minTimestamp) {
        var e_3, _a;
        try {
            for (var _b = __values(this.triggersByAlertId.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var alertId = _c.value;
                var records = this.triggersByAlertId.get(alertId) || [];
                this.triggersByAlertId.set(alertId, records.filter(function (r) { return r.timestamp >= minTimestamp; }));
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
    };
    BotAnalytics.prototype.isTriggerImbalance = function (stats) {
        var e_4, _a;
        try {
            for (var _b = __values(Object.keys(stats.alertTriggers)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var alertId = _c.value;
                if (stats.botTriggers[alertId] == null ||
                    (stats.botTriggers[alertId] || 0) < (stats.alertTriggers[alertId] || 0)) {
                    return true;
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
    };
    BotAnalytics.prototype.sync = function (timestamp) {
        return __awaiter(this, void 0, void 0, function () {
            var localStats, syncStats, isLocalIntervalSufficient;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.updateLocalTimestamps(timestamp);
                        this.clearOutdatedTriggerRecords(timestamp - this.observableInterval);
                        localStats = this.getLocalStats();
                        if (this.isTriggerImbalance(localStats))
                            throw new Error(BotAnalytics.TriggerImbalanceErrorCode);
                        if (this.lastSyncTimestamp >= 0 && timestamp - this.lastSyncTimestamp < this.syncTimeout)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.storage.load(this.botKey)];
                    case 1:
                        syncStats = _a.sent();
                        this.log('sync()', timestamp, localStats, syncStats);
                        isLocalIntervalSufficient = timestamp - this.firstLocalTimestamp >= this.observableInterval;
                        if (syncStats) {
                            /* check if it is a first time sync or the local stats interval is not sufficient */
                            if (this.lastSyncTimestamp < 0 || !isLocalIntervalSufficient) {
                                if (
                                /* check if sync data is not outdated */
                                timestamp - syncStats.endTimestamp < this.maxSyncDelay &&
                                    /* check if sync data interval is sufficient */
                                    syncStats.endTimestamp - syncStats.startTimestamp >= this.observableInterval) {
                                    this.syncStats = syncStats;
                                    this.log('Sync data is updated');
                                }
                                else {
                                    this.log('Sync data is skipped');
                                }
                            }
                        }
                        if (!
                        /* check if the local stats interval is sufficient */
                        (isLocalIntervalSufficient &&
                            /* check if the local stats are more recent than the sync one */
                            (!syncStats || syncStats.endTimestamp < timestamp) &&
                            /* check if the local stats has at least one non-zero value */
                            Object.values(localStats.botTriggers).find(function (v) { return v > 0; }))) 
                        /* check if the local stats interval is sufficient */
                        return [3 /*break*/, 3];
                        return [4 /*yield*/, this.storage.save(this.botKey, localStats)];
                    case 2:
                        _a.sent();
                        this.log('Sync data is uploaded successfully');
                        _a.label = 3;
                    case 3:
                        this.lastSyncTimestamp = timestamp;
                        return [2 /*return*/];
                }
            });
        });
    };
    BotAnalytics.prototype.incrementBotTriggers = function (timestamp, alertId) {
        if (alertId === void 0) { alertId = BotAnalytics.GeneralAlertId; }
        var triggers = this.triggersByAlertId.get(alertId) || [];
        triggers.push({ timestamp: timestamp, type: TriggerType.Bot });
        this.triggersByAlertId.set(alertId, triggers);
        this.updateLocalTimestamps(timestamp);
    };
    BotAnalytics.prototype.incrementAlertTriggers = function (timestamp, alertId) {
        if (alertId === void 0) { alertId = BotAnalytics.GeneralAlertId; }
        var triggers = this.triggersByAlertId.get(alertId) || [];
        triggers.push({ timestamp: timestamp, type: TriggerType.Alert });
        this.triggersByAlertId.set(alertId, triggers);
        this.updateLocalTimestamps(timestamp);
    };
    BotAnalytics.prototype.getAnomalyScore = function (alertId) {
        if (alertId === void 0) { alertId = BotAnalytics.GeneralAlertId; }
        if (this.lastLocalTimestamp > 0) {
            this.clearOutdatedTriggerRecords(this.lastLocalTimestamp - this.observableInterval);
        }
        if (this.lastLocalTimestamp - this.firstLocalTimestamp >= this.observableInterval) {
            var stats = this.getLocalStats();
            this.log('getAnomalyScore()', 'Using local data');
            if (this.isTriggerImbalance(stats)) {
                throw new Error(BotAnalytics.TriggerImbalanceErrorCode);
            }
            var alertTriggers = stats.alertTriggers[alertId];
            var botTriggers = stats.botTriggers[alertId];
            if (alertTriggers == null || alertTriggers <= 0) {
                this.log('getAnomalyScore()', 'Zero alert triggers, fallback to default score');
                return this.defaultAnomalyScore[alertId];
            }
            return alertTriggers / botTriggers;
        }
        if (this.syncStats && !this.isTriggerImbalance(this.syncStats)) {
            var alertTriggers = this.syncStats.alertTriggers[alertId];
            var botTriggers = this.syncStats.botTriggers[alertId];
            this.log('getAnomalyScore()', 'Using sync data');
            if (alertTriggers == null || alertTriggers <= 0) {
                this.log('getAnomalyScore()', 'Zero alert triggers, fallback to default score');
                return this.defaultAnomalyScore[alertId];
            }
            return alertTriggers / botTriggers;
        }
        this.log('getAnomalyScore()', 'Using default score');
        var defaultValue = this.defaultAnomalyScore[alertId];
        if (defaultValue == null)
            throw new Error(BotAnalytics.NoDefaultScoreErrorCode);
        return defaultValue;
    };
    BotAnalytics.StorageKey = 'stats-v1';
    BotAnalytics.GeneralAlertId = 'GENERAL';
    BotAnalytics.TriggerImbalanceErrorCode = 'TriggerImbalanceError';
    BotAnalytics.NoDefaultScoreErrorCode = 'NoDefaultScoreError';
    return BotAnalytics;
}());
exports.BotAnalytics = BotAnalytics;
//# sourceMappingURL=analytics.js.map