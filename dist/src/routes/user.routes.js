"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_controller_1 = require("../controllers/user.controller");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
router.get('/search', auth_middleware_1.protect, user_controller_1.userController.searchUsers);
router.put('/profile', auth_middleware_1.protect, upload_middleware_1.upload.single('image'), user_controller_1.userController.updateProfile);
// 🆕 Change Password Route
router.put('/change-password', auth_middleware_1.protect, user_controller_1.userController.changePassword);
exports.userRoutes = router;
