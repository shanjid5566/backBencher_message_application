"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const AppError_1 = __importDefault(require("../utils/AppError"));
const validateRequest = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const messages = error.details.map((detail) => detail.message).join(', ');
            return next(new AppError_1.default(400, messages));
        }
        // Replace the original data with validated data
        req[source] = value;
        next();
    };
};
exports.validateRequest = validateRequest;
