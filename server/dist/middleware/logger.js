"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = logger;
function logger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, url, ip } = req;
        const { statusCode } = res;
        console.log(`[${new Date().toISOString()}] ${method} ${url} - ${statusCode} - ${duration}ms - ${ip}`);
    });
    next();
}
