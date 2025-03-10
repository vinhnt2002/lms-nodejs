"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const userRouter = express_1.default.Router();
userRouter.post('/registration', user_controller_1.registrationUser);
userRouter.post('/activate-user', user_controller_1.activateUser);
userRouter.post('/login', user_controller_1.loginUser);
userRouter.get("/logout", auth_1.isAuthenticated, /* authorized("admin")  */ user_controller_1.logoutUser);
userRouter.get("/refresh-token", user_controller_1.updateAccessToken);
userRouter.get("/user-info", auth_1.isAuthenticated, user_controller_1.getUserInfo);
userRouter.put("/update-user", auth_1.isAuthenticated, user_controller_1.updateUser);
userRouter.put("/update-user-password", auth_1.isAuthenticated, user_controller_1.updatePasswordUser);
userRouter.put("/update-user-avatar", auth_1.isAuthenticated, user_controller_1.updateProfilePicture);
userRouter.get("/users", auth_1.isAuthenticated, (0, auth_1.authorized)("admin"), user_controller_1.getAllUsers);
userRouter.put("/update-role", auth_1.isAuthenticated, (0, auth_1.authorized)("admin"), user_controller_1.updateUserRole);
userRouter.delete("/delete-user/:id", auth_1.isAuthenticated, (0, auth_1.authorized)("admin"), user_controller_1.deleteUser);
//test later
userRouter.get("/social-auth", user_controller_1.socialAuth);
//
exports.default = userRouter;
