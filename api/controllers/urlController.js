import Url from '../models/urlModel.js';
import moment from 'moment';
import shortid from 'shortid';

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
        shortUrl = shortid.generate();
      }
      const newUrl = new Url({
        fullUrl: longUrl,
        shortUrl,
        customAlias: customAlias || undefined,
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
      const osTypeMap = new Map();
      const deviceTypeMap = new Map();
  
      const urlAnalytics = urls.map((url) => {
        const analytics = url.analytics;
  
        const urlClicks = analytics.length;
        totalClicks += urlClicks;
  
        const urlUniqueUsers = new Set(analytics.map((entry) => entry.ipAddress));
        urlUniqueUsers.forEach((user) => uniqueUsersSet.add(user));
  
        analytics.forEach((entry) => {
          const entryDate = moment(entry.timestamp).format('YYYY-MM-DD');
          clicksByDateMap.set(entryDate, (clicksByDateMap.get(entryDate) || 0) + 1);
  
          const os = getOS(entry.userAgent);
          if (!osTypeMap.has(os)) {
            osTypeMap.set(os, { uniqueClicks: 0, uniqueUsers: new Set() });
          }
          osTypeMap.get(os).uniqueClicks++;
          osTypeMap.get(os).uniqueUsers.add(entry.ipAddress);
  
          const device = getDeviceType(entry.userAgent);
          if (!deviceTypeMap.has(device)) {
            deviceTypeMap.set(device, { uniqueClicks: 0, uniqueUsers: new Set() });
          }
          deviceTypeMap.get(device).uniqueClicks++;
          deviceTypeMap.get(device).uniqueUsers.add(entry.ipAddress);
        });
  
        return {
          shortUrl: url.shortUrl,
          totalClicks: urlClicks,
          uniqueUsers: urlUniqueUsers.size,
        };
      });
  
      const clicksByDate = Array.from({ length: 7 }, (_, i) => {
        const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
        return { date, clickCount: clicksByDateMap.get(date) || 0 };
      }).reverse();
  
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
        totalClicks,
        uniqueUsers: uniqueUsersSet.size,
        clicksByDate,
        osType,
        deviceType,
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
  
          const os = getOS(entry.userAgent);
          if (!osTypeMap.has(os)) {
            osTypeMap.set(os, { uniqueClicks: 0, uniqueUsers: new Set() });
          }
          osTypeMap.get(os).uniqueClicks++;
          osTypeMap.get(os).uniqueUsers.add(entry.ipAddress);
  
          const device = getDeviceType(entry.userAgent);
          if (!deviceTypeMap.has(device)) {
            deviceTypeMap.set(device, { uniqueClicks: 0, uniqueUsers: new Set() });
          }
          deviceTypeMap.get(device).uniqueClicks++;
          deviceTypeMap.get(device).uniqueUsers.add(entry.ipAddress);
        });
      });
  
      const clicksByDate = Array.from({ length: 7 }, (_, i) => {
        const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
        return { date, clickCount: clicksByDateMap.get(date) || 0 };
      }).reverse();
  
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
  
export  {
    createShortUrl,
    redirectShortUrl,
    getUrlAnalytics,
    getTopicAnalytics,
    getOverallAnalytics,
}