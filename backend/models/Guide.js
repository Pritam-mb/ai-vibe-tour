import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  userId: { type: String, required: true },
  userName: { type: String, required: true }
}, { timestamps: true })

const guideSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  specialty: { type: String, required: true },
  languages: { type: [String], default: ['English'] },
  pricePerDay: { type: Number, required: true },
  experience: { type: Number, default: 0 },
  bio: { type: String, default: '' },
  destination: { type: String, required: true },
  certifications: { type: [String], default: [] },
  availability: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  reviews: [reviewSchema]
}, { timestamps: true })

export default mongoose.model('Guide', guideSchema)
