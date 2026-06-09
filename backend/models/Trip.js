import mongoose from 'mongoose'

const tripSchema = new mongoose.Schema({
  name: { type: String, required: true },
  creatorId: { type: String, required: true },
  memberIds: [{ type: String }],
  members: [mongoose.Schema.Types.Mixed],
  status: { type: String, default: 'planning' },
  destination: { type: String, required: true },
  departureCity: { type: String },       // Where the user travels FROM
  budget: { type: Number, required: true },
  travelStyle: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number },
  // Geocoded coordinates
  lat: { type: Number },                 // Destination lat
  lng: { type: Number },                 // Destination lng
  departureLat: { type: Number },        // Departure city lat
  departureLng: { type: Number },        // Departure city lng
  specialDestinations: { type: String },
  itinerary: [mongoose.Schema.Types.Mixed],
  pendingRequests: [mongoose.Schema.Types.Mixed],
  journeyPaths: [mongoose.Schema.Types.Mixed]
}, { timestamps: true })

export default mongoose.model('Trip', tripSchema)
