import mongoose from "mongoose";
import SecurityUtils from "../utils/securitlyUtils";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      validate: {
        validator: function (userName) {
          return /^[a-zA-Z0-9_]{3,16}$/.test(userName);
        },
        message: "please enter a valid message",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email) {
          return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
        },
        message: "please enter a valid email",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      validate: {
        validator: function (password) {
          if (
            this.modified("password") &&
            password &&
            !password.startsWith("$2a$")
          ) {
            const validation = SecurityUtils.validatePassword(password);
            return validation.success;
          }
          return true;
        },
        message: function (props) {
          if (props.value && !props.value.startsWith("$2a$")) {
            const validation = SecurityUtils.validatePassword(props.value);
            return validation.errors.join(".");
          }
          return "password validation failed";
        },
      },
    },
    role: {
      type: String,
      enum: ["super_admin", "client_admin", "client_view"],
      default: "client_viewer",
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "client",
      required: function () {
        return this.role != "super_admin";
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    permission: {
      canCreateApiKeys: {
        type: Boolean,
        default: false,
      },
      canManageUsers: {
        type: Boolean,
        default: false,
      },
      canViewAnalytics: {
        type: Boolean,
        default: true,
      },
      canExportData: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.gensalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(errort);
  }
});

userSchema.index({ clientId: i, isActive: 1 });
userSchema.index({ role: 1 });

const user = mongoose.model("User", userSchema);
export default userSchema;
