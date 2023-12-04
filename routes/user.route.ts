import express from "express"
import { activateUser, getUserInfo, loginUser, logoutUser, registrationUser, socialAuth, updateAccessToken, updatePasswordUser, updateProfilePicture, updateUser } from "../controllers/user.controller";
import { authorized, isAuthenticated } from "../middleware/auth";

const userRouter = express.Router();

userRouter.post('/registration', registrationUser)

userRouter.post('/activate-user', activateUser)

userRouter.post('/login', loginUser)

userRouter.get("/logout", isAuthenticated , /* authorized("admin")  */  logoutUser)

userRouter.get("/refresh-token",  updateAccessToken)

userRouter.get("/user-info", isAuthenticated ,   getUserInfo)

userRouter.put("/update-user", isAuthenticated, updateUser)

userRouter.put("/update-user-password", isAuthenticated, updatePasswordUser)

userRouter.put("/update-user-avatar", isAuthenticated, updateProfilePicture)


//test later
userRouter.get("/social-auth", socialAuth)
//

export default userRouter