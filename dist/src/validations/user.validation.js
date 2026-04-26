"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRoleSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.updateUserRoleSchema = joi_1.default.object({
    role: joi_1.default.string().valid('ADMIN', 'USER').required().messages({
        'any.only': 'Role must be either ADMIN or USER',
    }),
});
