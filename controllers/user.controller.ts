import { accessTokenOptions, refreshTokenOptions } from './../utils/jwt';
require("dotenv").config();

import { Request, Response, NextFunction } from "express";
import userModal, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/error-handler";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import cloudinary from 'cloudinary'

import sendMail from "../utils/send-mail";
import { sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { getUserById } from '../services/user.service';
import { deleteImageFromCloudinary, uploadImageToCloudinary } from '../utils/cloudinary';

//register user
interface IRegisterationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

interface IActivationToken {
  token: string;
  activationCode: string;
}

//activate user take from client
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

//login
interface ILoginRequest {
  email: string;
  password: string;
}

export const registrationUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, avatar } = req.body;

      const isEmailExist = await userModal.findOne({ email });

      if (isEmailExist) {
        return next(new ErrorHandler("Email already exits", 400));
      }

      const user: IRegisterationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);

      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          template: "activation-mail.ejs",
          data,
        });

        return res.status(200).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account!`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET as Secret,
    { expiresIn: "5m" }
  );

  return { token, activationCode };
};

export const activateUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { name, email, password } = newUser.user;

      const exisUser = await userModal.findOne({ email });

      if (exisUser) {
        return next(new ErrorHandler("Email already exist", 400));
      }

      const user = await userModal.create({
        name,
        email,
        password,
      });

      res.status(200).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//login user
export const loginUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      if (!email || !password) {
        return next(new ErrorHandler("please enter Email and Password", 400));
      }

      const user = await userModal.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("Invalid Email or Password", 400));
      }

      const isPasswordMatch = await user.comparePassword(password);

      if(!isPasswordMatch) {
        return next(new ErrorHandler("Invalid Password", 400));
      }

      // sign token for jwt
      sendToken(user, 200, res)

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//logout user

export const logoutUser = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.cookie("access_token", "", {maxAge: 1})
    res.cookie("refresh_token", "", {maxAge: 1})

    redis.del(req.user?._id)

    res.status(200).json({
      success: true,
      message: "Logout successfully"
    })
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
})


// update access token 
export const updateAccessToken = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;

      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;
      const message = "could not refresh token";

      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }

      const session = await redis.get(decoded.id as string)
      if(!session) {
        return next(new ErrorHandler(message, 400));
      }
      
      const user = JSON.parse(session)

      const accessToken = jwt.sign(
        {id: user._id},
        process.env.ACCESS_TOKEN as string,
        {expiresIn: "5m"}
      )
      const refreshToken = jwt.sign(
        {id: user._id},
        process.env.REFRESH_TOKEN as string,
        {expiresIn: "3d"}
      )

      res.cookie("access_token" , accessToken, accessTokenOptions)
      res.cookie("refresh_token", refreshToken, refreshTokenOptions)

      req.user = user

      res.status(200).json({
        status: "success",
        accessToken
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


//get user info
export const getUserInfo = CatchAsyncErrors(async(req:Request, res: Response, next : NextFunction) => {
  try {
    const userId = req.user?._id;
    getUserById(userId, res)
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
})

//get social auth
interface ISocialAuthRequest {
  email: string,
  name: string,
  avatar: string,
}

export const socialAuth = CatchAsyncErrors(async(req:Request, res: Response, next : NextFunction) => {
  try {
    const {email, name, avatar} = req.body as ISocialAuthRequest
    
    const user = await userModal.findOne({email})

    if(!user){
      const newUser = await userModal.create({email, name, avatar})
      sendToken(newUser, 200, res)
    }else{
      sendToken(user, 200, res)
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})

// udapte user

interface IUpdateUserInfo {
  email: string,
  name: string
}

export const updateUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name } = req.body as IUpdateUserInfo;

      const userId = req.user?._id;
      const user = await userModal.findById(userId);

      if (email && user) {
        const isEmailExist = await userModal.findOne({ email });
        if (isEmailExist) {
          return next(new ErrorHandler("Email aldready exits", 400));
        }

        user.email = email;
      }

      if (name && user) {
        user.name = name;
      }

      await user?.save();
      await redis.set(userId, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//update password user
interface IUpdatePassword {
  oldPassword: string,
  newPassword: string
}

export const updatePasswordUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;

      if (!oldPassword || !newPassword) {
        return next(
          new ErrorHandler("Please enter the old and new password", 400)
        );
      }

      const user = await userModal.findById(req.user?._id).select("+password");

      if (user?.password === undefined) {
        return next(new ErrorHandler("Invalid User", 400));
      }

      const isPasswordMatch = await user?.comparePassword(oldPassword);

      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid Old pasword", 400));
      }

      user.password = newPassword;
      await user?.save();

      await redis.set(req.user?._id, JSON.stringify(user));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


//update image user
interface IUpdateProfilePicture {
  avatar: string
}

export const updateProfilePicture = CatchAsyncErrors(async(req:Request, res: Response, next : NextFunction) => {
  try {
    const { avatar } = req.body as IUpdateProfilePicture;

    const userId = req.user?._id;

    const user = await userModal.findById(userId);

    if (avatar && user) {
      if (user.avatar.public_id) {
        await deleteImageFromCloudinary(user.avatar.public_id);
      }
      const myCloud = await uploadImageToCloudinary(avatar, "avatars", 150);

      user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.url,
      };
    }

    res.status(200).json({
      success: true,
      user,
    });

    await user?.save();
    await redis.set(userId, JSON.stringify(user));
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
})