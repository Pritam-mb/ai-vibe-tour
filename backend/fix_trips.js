import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB');
    const db = mongoose.connection.db;
    
    // We will directly update documents in the collection without using Mongoose schema 
    // to bypass any missing schema issues if there are any.
    const tripsCollection = db.collection('trips');
    const trips = await tripsCollection.find({}).toArray();
    
    console.log(`Found ${trips.length} trips`);
    
    for (const trip of trips) {
      if (!trip.memberIds || trip.memberIds.length === 0) {
        // Find if creatorId exists, or just fallback to some logic
        let memberIds = [];
        if (trip.creatorId) {
          memberIds.push(trip.creatorId);
        } else if (trip.members && trip.members.length > 0) {
          memberIds.push(trip.members[0].uid);
        }
        
        if (memberIds.length > 0) {
          await tripsCollection.updateOne(
            { _id: trip._id },
            { $set: { memberIds: memberIds } }
          );
          console.log(`Updated trip ${trip._id} with memberIds: ${memberIds}`);
        } else {
          console.log(`Could not determine memberIds for trip ${trip._id}`);
        }
      }
    }
    console.log('Done');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
