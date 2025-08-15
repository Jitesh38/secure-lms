import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";
import { ApiResponse } from "../middleware/error.middleware.js";
import crypto from "crypto";

/**
 * Create a new user account
 * @route POST /api/v1/users/signup
 */
export const createUserAccount = catchAsync(async (req, res) => {
  // TODO: Implement create user account functionality

  const { name, email, password, role, bio } = req.body;
  let avatarPath = req.file?.path;

  if ([name, email, password, role, bio].some((ele) => ele?.trim().length === 0 || !ele) || !avatarPath) {
    throw new AppError('Please Provide all fields', 400);
  }
  // const uploadedAvatar = await uploadMedia(avatarPath);
  const uploadedAvatar = `https://res.cloudinary.com/ddwgvjj4a/image/upload/v1755246021/hkhzrxz1jnscqqqruszd.jpg`;

  const existedUSer = await User.findOne({
    email
  })

  if (existedUSer) {
    throw new AppError('Email or User already exist. Try new Credentials', 400)
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    bio,
    avatar: uploadedAvatar
  })

  if (!user) {
    throw new AppError('Database error! Try after some time', 400)
  }

  res.status(201).json(new ApiResponse(201, user, "User created successfully"))
});

/**
 * Authenticate user and get token
 * @route POST /api/v1/users/signin
 */
export const authenticateUser = catchAsync(async (req, res) => {

  const { email, password } = req.body;

  if ([email, password].some((ele) => ele?.trim().length === 0 || !ele)) {
    throw new AppError('Please provide all fields', 400);
  }

  const existedUser = await User.findOne({
    email
  }).select('+password')

  console.log(existedUser);

  if (!existedUser) {
    throw new AppError('Please Sign Up first to Sign In', 400);
  }

  const isPasswordCorrect = await existedUser.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new AppError('Please enter a correct password', 400);
  }

  generateToken(res, existedUser, 'Sign in successfull')
});

/**
 * Sign out user and clear cookie
 * @route POST /api/v1/users/signout
 */
export const signOutUser = catchAsync(async (_, res) => {
  // TODO: Implement sign out functionality

  res.clearCookies('token').status(200).json(new ApiResponse(200,{},"Sign out successfull"))
});

/**
 * Get current user profile
 * @route GET /api/v1/users/profile
 */
export const getCurrentUserProfile = catchAsync(async (req, res) => {
  // TODO: Implement get current user profile functionality
});

/**
 * Update user profile
 * @route PATCH /api/v1/users/profile
 */
export const updateUserProfile = catchAsync(async (req, res) => {
  // TODO: Implement update user profile functionality
});

/**
 * Change user password
 * @route PATCH /api/v1/users/password
 */
export const changeUserPassword = catchAsync(async (req, res) => {
  // TODO: Implement change user password functionality
});

/**
 * Request password reset
 * @route POST /api/v1/users/forgot-password
 */
export const forgotPassword = catchAsync(async (req, res) => {
  // TODO: Implement forgot password functionality
});

/**
 * Reset password
 * @route POST /api/v1/users/reset-password/:token
 */
export const resetPassword = catchAsync(async (req, res) => {
  // TODO: Implement reset password functionality
});

/**
 * Delete user account
 * @route DELETE /api/v1/users/account
 */
export const deleteUserAccount = catchAsync(async (req, res) => {
  // TODO: Implement delete user account functionality
});
