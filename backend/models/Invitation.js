import mongoose from 'mongoose'

const invitationSchema = new mongoose.Schema({
  tripId: { type: String, required: true },
  tripName: { type: String, required: true },
  inviterEmail: { type: String, required: true },
  inviteeEmail: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date },
  declinedAt: { type: Date }
})

export default mongoose.model('Invitation', invitationSchema)
