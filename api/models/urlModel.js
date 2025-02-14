import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  fullUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    unique: true,
    required: true,
  },
  customAlias: {
    type: String,
    unique: true,
    sparse: true,
  },
  topic: {
    type: String,
  },
  clicks: {
    type: Number,
    required: true,
    default: 0,
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  analytics: [
    {
      timestamp: { type: Date, default: Date.now },
      userAgent: String,
      ipAddress: String,
      location: {
        country: String,
        city: String,
      },
    },
  ],
});

const Url = mongoose.model('Url', urlSchema);

export default Url;