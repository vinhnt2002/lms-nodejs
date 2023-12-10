import { Response } from "express";
import { redis } from "../utils/redis";
import userModal from "../models/user.model";

export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);

  if (userJson) {
    const user = JSON.parse(userJson);
    res.status(201).json({
      success: true,
      user,
    });
  }
};

// get all user 
export const getAllUsersServices = async (res: Response) => {
  const users = await userModal.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    users,
  });
};

export const updateUserRoleServices = async (res: Response, id: string, role: string) => {
  const user = await userModal.findByIdAndUpdate(id, {role}, {new : true})

  res.status(200).json({
    success: true,
    user,
  });
}
