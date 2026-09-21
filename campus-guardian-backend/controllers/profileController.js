const bcrypt = require('bcryptjs');
const User = require('../models/User');

const safeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  return obj;
};

const getMobilePath = () => {
  if (User.schema.path('mobile')) return 'mobile';
  if (User.schema.path('phone')) return 'phone';
  return null;
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, mobile } = req.body;
    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (cleanName.length < 2) {
        return res.status(400).json({ success: false, message: 'Name must contain at least 2 characters' });
      }
      user.name = cleanName;
    }

    if (mobile !== undefined) {
      const cleanMobile = String(mobile).trim();
      if (cleanMobile && !/^[0-9+()\-\s]{7,20}$/.test(cleanMobile)) {
        return res.status(400).json({ success: false, message: 'Enter a valid mobile number' });
      }
      const mobilePath = getMobilePath();
      if (!mobilePath) {
        return res.status(500).json({ success: false, message: 'Mobile field is not configured in the User model' });
      }
      user[mobilePath] = cleanMobile;
    }

    await user.save();
    res.json({ success: true, message: 'Profile updated successfully', data: safeUser(user) });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Current password, new password and confirmation are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.password) {
      return res.status(500).json({ success: false, message: 'Password data is unavailable for this account' });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from the current password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully. You can now login with your new password.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, changePassword };
