import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import Url from '../models/urlModel.js';
import moment from 'moment';
import axios from 'axios';

// @desc    Auth user & get token
// @route   POST /api/users/auth
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: token,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});


// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const createShortUrl = async (req, res) => {
  try {
    const { longUrl, customAlias, topic } = req.body;
    const userEmail = req.user.email;

    let shortUrl;
    if (customAlias) {

      const existingAlias = await Url.findOne({ customAlias });

      if (existingAlias) {
        return res.status(400).json({ error: 'Custom alias already in use' });
      }
      shortUrl = customAlias;
    } else {
      shortUrl = shortId.generate();
    }
    const newUrl = new Url({
      fullUrl: longUrl,
      shortUrl,
      customAlias: customAlias || null,
      topic,
      userEmail,
    });

    await newUrl.save();
    
    res.status(201).json({
      shortUrl: `${process.env.BASE_URL}/${shortUrl}`,
      createdAt: newUrl.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

const redirectShortUrl = async (req, res) => {
  try {
    const { alias } = req.params;

    const urlEntry = await Url.findOne({
      $or: [{ shortUrl: alias }, { customAlias: alias }],
    });

    if (!urlEntry) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const userAgent = req.headers['user-agent'];
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    urlEntry.analytics.push({ timestamp: new Date(), userAgent, ipAddress });

    urlEntry.clicks += 1;

    await urlEntry.save();

    res.redirect(urlEntry.fullUrl);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getUrlAnalytics = async (req, res) => {
  try {
    const { alias } = req.params;

    const urlEntry = await Url.findOne({
      $or: [{ shortUrl: alias }, { customAlias: alias }],
    });

    if (!urlEntry) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const analytics = urlEntry.analytics;

    const totalClicks = analytics.length;

    const uniqueUsers = new Set(analytics.map((entry) => entry.ipAddress)).size;

    const clicksByDate = Array(7).fill(0).map((_, i) => ({
      date: moment().subtract(i, 'days').format('YYYY-MM-DD'),
      clickCount: 0,
    }));

    analytics.forEach((entry) => {
      const entryDate = moment(entry.timestamp).format('YYYY-MM-DD');
      const found = clicksByDate.find((d) => d.date === entryDate);
      if (found) found.clickCount += 1;
    });

    const osClicksMap = new Map();

    analytics.forEach((entry) => {
      const osName = getOS(entry.userAgent);
      if (!osClicksMap.has(osName)) {
        osClicksMap.set(osName, { osName, uniqueClicks: 0, uniqueUsers: new Set() });
      }
      osClicksMap.get(osName).uniqueClicks += 1;
      osClicksMap.get(osName).uniqueUsers.add(entry.ipAddress);
    });

    const osType = Array.from(osClicksMap.values()).map((item) => ({
      osName: item.osName,
      uniqueClicks: item.uniqueClicks,
      uniqueUsers: item.uniqueUsers.size,
    }));

    const deviceClicksMap = new Map();

    analytics.forEach((entry) => {
      const deviceName = getDeviceType(entry.userAgent);
      if (!deviceClicksMap.has(deviceName)) {
        deviceClicksMap.set(deviceName, { deviceName, uniqueClicks: 0, uniqueUsers: new Set() });
      }
      deviceClicksMap.get(deviceName).uniqueClicks += 1;
      deviceClicksMap.get(deviceName).uniqueUsers.add(entry.ipAddress);
    });

    const deviceType = Array.from(deviceClicksMap.values()).map((item) => ({
      deviceName: item.deviceName,
      uniqueClicks: item.uniqueClicks,
      uniqueUsers: item.uniqueUsers.size,
    }));

    res.json({
      totalClicks,
      uniqueUsers,
      clicksByDate,
      osType,
      deviceType,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getOS = (userAgent) => {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  return 'Unknown';
};

const getDeviceType = (userAgent) => {
  if (/mobile/i.test(userAgent)) return 'Mobile';
  return 'Desktop';
};

const getTopicAnalytics = async (req, res) => {
  try {
    const { topic } = req.params;

    const urls = await Url.find({ topic });

    if (urls.length === 0) {
      return res.status(404).json({ error: 'No URLs found for this topic' });
    }

    let totalClicks = 0;
    let uniqueUsersSet = new Set();
    const clicksByDateMap = new Map();

    const urlAnalytics = urls.map((url) => {
      const analytics = url.analytics;

      const urlClicks = analytics.length;
      totalClicks += urlClicks;

      const urlUniqueUsers = new Set(analytics.map((entry) => entry.ipAddress));
      urlUniqueUsers.forEach((user) => uniqueUsersSet.add(user));

      analytics.forEach((entry) => {
        const entryDate = moment(entry.timestamp).format('YYYY-MM-DD');
        clicksByDateMap.set(entryDate, (clicksByDateMap.get(entryDate) || 0) + 1);
      });

      return {
        shortUrl: url.shortUrl,
        totalClicks: urlClicks,
        uniqueUsers: urlUniqueUsers.size,
      };
    });

    const clicksByDate = Array(7).fill(0).map((_, i) => {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
      return { date, clickCount: clicksByDateMap.get(date) || 0 };
    });

    res.json({
      totalClicks,
      uniqueUsers: uniqueUsersSet.size,
      clicksByDate,
      urls: urlAnalytics,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};



const getOverallAnalytics = async (req, res) => {
  try {
    const userId = req.user.email;

    const urls = await Url.find({ userEmail: userId });

    if (urls.length === 0) {
      return res.status(404).json({ error: 'No URLs found for this user' });
    }

    let totalClicks = 0;
    let uniqueUsersSet = new Set();
    const clicksByDateMap = new Map();
    const osTypeMap = new Map();
    const deviceTypeMap = new Map();

    urls.forEach((url) => {
      url.analytics.forEach((entry) => {
        totalClicks++;
        uniqueUsersSet.add(entry.ipAddress);

        const entryDate = moment(entry.timestamp).format('YYYY-MM-DD');
        clicksByDateMap.set(entryDate, (clicksByDateMap.get(entryDate) || 0) + 1);

        const os = entry.os || 'Unknown';
        if (!osTypeMap.has(os)) {
          osTypeMap.set(os, { uniqueClicks: 0, uniqueUsers: new Set() });
        }
        osTypeMap.get(os).uniqueClicks++;
        osTypeMap.get(os).uniqueUsers.add(entry.ipAddress);

        const device = entry.device || 'Unknown';
        if (!deviceTypeMap.has(device)) {
          deviceTypeMap.set(device, { uniqueClicks: 0, uniqueUsers: new Set() });
        }
        deviceTypeMap.get(device).uniqueClicks++;
        deviceTypeMap.get(device).uniqueUsers.add(entry.ipAddress);
      });

    });

    const clicksByDate = Array(7).fill(0).map((_, i) => {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
      return { date, clickCount: clicksByDateMap.get(date) || 0 };
    });

    const osType = Array.from(osTypeMap, ([osName, data]) => ({
      osName,
      uniqueClicks: data.uniqueClicks,
      uniqueUsers: data.uniqueUsers.size,
    }));

    const deviceType = Array.from(deviceTypeMap, ([deviceName, data]) => ({
      deviceName,
      uniqueClicks: data.uniqueClicks,
      uniqueUsers: data.uniqueUsers.size,
    }));

    res.json({
      totalUrls: urls.length,
      totalClicks,
      uniqueUsers: uniqueUsersSet.size,
      clicksByDate,
      osType,
      deviceType,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};


export {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  createShortUrl,
  redirectShortUrl,
  getUrlAnalytics,
  getTopicAnalytics,
  getOverallAnalytics
};
