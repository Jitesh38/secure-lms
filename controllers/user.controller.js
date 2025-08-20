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

  if (
    [name, email, password, role, bio].some(
      (ele) => ele?.trim().length === 0 || !ele
    ) ||
    !avatarPath
  ) {
    throw new AppError("Please Provide all fields", 400);
  }
  // const uploadedAvatar = await uploadMedia(avatarPath);
  const uploadedAvatar = `https://res.cloudinary.com/ddwgvjj4a/image/upload/v1755246021/hkhzrxz1jnscqqqruszd.jpg`;

  const existedUSer = await User.findOne({
    email,
  });

  if (existedUSer) {
    throw new AppError(
      "Email or User already exist. Try new Credentials",
      400
    );
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    bio,
    avatar: uploadedAvatar,
  });

  if (!user) {
    throw new AppError("Database error! Try after some time", 400);
  }

  res.status(201).json(
    new ApiResponse(201, user, "User created successfully")
  );
});

/**
 * Authenticate user and get token
 * @route POST /api/v1/users/signin
 */
export const authenticateUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((ele) => ele?.trim().length === 0 || !ele)) {
    throw new AppError("Please provide all fields", 400);
  }

  const existedUser = await User.findOne({
    email,
  }).select("+password");

  console.log(existedUser);

  if (!existedUser) {
    throw new AppError("Please Sign Up first to Sign In", 400);
  }

  const isPasswordCorrect = await existedUser.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new AppError("Please enter a correct password", 400);
  }

  generateToken(res, existedUser, "Sign in successfull");
});

/**
 * Sign out user and clear cookie
 * @route POST /api/v1/users/signout
 */
export const signOutUser = catchAsync(async (_, res) => {
  // TODO: Implement sign out functionality

  res.clearCookie("token")
    .status(200)
    .json(new ApiResponse(200, {}, "Sign out successfull"));
});

/**
 * Get current user profile
 * @route GET /api/v1/users/profile
 */
export const getCurrentUserProfile = catchAsync(async (req, res) => {
  // TODO: Implement get current user profile functionality
  res.status(200).json(
    new ApiResponse(200, req.user, "User fetched successfully")
  );
});

/**
 * Update user profile
 * @route PATCH /api/v1/users/profile
 */
export const updateUserProfile = catchAsync(async (req, res) => {
  // TODO: Implement update user profile functionality
  const { name, email } = req.body;
  const updateData = {};

  if (name && name?.trim().length > 0) updateData.name = name;
  if (email && email?.trim().length > 0) {
    const user = await User.findOne({ email });
    if (user) {
      throw new AppError("This email is already taken. Try some new one");
    } else {
      updateData.email = email;
    }
  }
  if (req.file) {
    let avatar = await uploadMedia(req.file?.path);
    updateData.avatar = avatar.url;
  }

  const user = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new AppError("There is error in database. Try after some time.");
  }

  res.status(200).json(
    new ApiResponse(200, user, "User updated successfully")
  );
});

/**
 * Change user password
 * @route PATCH /api/v1/users/password
 */
export const changeUserPassword = catchAsync(async (req, res) => {
  // TODO: Implement change user password functionality
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  user.password = newPassword;
  user.save();

  res.status(200).json(
    new ApiResponse(200, user, "Password changed successfully")
  );
});

/**
 * Request password reset
 * @route POST /api/v1/users/forgot-password
 */
export const forgotPassword = catchAsync(async (req, res) => {
  // TODO: Implement forgot password functionality
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("User not found!", 400);
  }

  let token = await user.getResetPasswordToken();
  await user.save();
  res.status(200).json(
    new ApiResponse(200, { token }, "Token created successfully")
  );
});

/**
 * Reset password
 * @route POST /api/v1/users/reset-password/:token
 */
export const resetPassword = catchAsync(async (req, res) => {
  // TODO: Implement reset password functionality
  const token = req.params.token;
  const { newPassword } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    throw new AppError("User not Found! Invalid token.", 400);
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, user, "Reset password successfully")
  );
});

/**
 * Delete user account
 * @route DELETE /api/v1/users/account
 */
export const deleteUserAccount = catchAsync(async (req, res) => {
  const user = await User.findByIdAndDelete(req.id);
  console.log(user);
  if (!user) {
    throw new AppError("Invalid request!", 400);
  }
  const lastSegment = user.avatar.split("/").pop();         // "hkhzrxz1jnscqqqruszd.jpg"
  const publicId = lastSegment.split(".")[0];
  await deleteMediaFromCloudinary(publicId);

  res.status(200).json(
    new ApiResponse(200, {}, "Account deleted successfully")
  );
});
