const API_URL = import.meta.env.VITE_API_URL || '/api'

export const tripService = {
  // Create a new trip
  async createTrip(tripData) {
    const memberIds = Array.from(
      new Set(
        (tripData.memberIds || (tripData.members || [])
          .map((m) => (typeof m === 'string' ? m : m?.uid))
          .filter(Boolean))
      )
    )

    const res = await fetch(`${API_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...tripData, memberIds })
    });
    
    if (!res.ok) throw new Error('Failed to create trip');
    const data = await res.json();
    return data.tripId;
  },

  // Get user's trips
  async getUserTrips(userId) {
    const res = await fetch(`${API_URL}/trips/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch trips');
    const trips = await res.json();
    // Normalize _id -> id so frontend trip.id links work
    return trips.map(t => ({ id: t._id, ...t }));
  },

  // Subscribe to real-time trip updates (simulate with polling)
  subscribeToTrip(tripId, callback) {
    let timeoutId;
    let isSubscribed = true;
    
    const poll = async () => {
      if (!isSubscribed) return;
      try {
        const res = await fetch(`${API_URL}/trips/${tripId}`);
        if (res.ok) {
          const trip = await res.json();
          callback({ id: trip._id, ...trip });
        }
      } catch (e) {
        console.error('Error polling trip:', e);
      }
      if (isSubscribed) {
        timeoutId = setTimeout(poll, 3000);
      }
    };
    
    poll();
    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
    };
  },

  // Generate itinerary using AI
  async generateItinerary(tripId) {
    if (!tripId || tripId === 'undefined') {
      throw new Error('Invalid trip ID')
    }
    const res = await fetch(`${API_URL}/trips/${tripId}/generate-itinerary`, {
      method: 'POST'
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Itinerary generation failed: ${res.status} ${res.statusText} ${text}`)
    }

    return res.json()
  },

  // Add a new request
  async addRequest(tripId, requestData) {
    const newRequest = {
      id: Date.now().toString(),
      ...requestData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      suggestedBy: 'Current User' // TODO: Get from auth
    };
    const res = await fetch(`${API_URL}/trips/${tripId}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    });
    if (!res.ok) throw new Error('Failed to add request');
    return res.json();
  },

  // Analyze request with AI
  async analyzeRequest(tripId, requestId) {
    const response = await fetch(`${API_URL}/trips/${tripId}/analyze-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    })
    return response.json()
  },

  // Accept request and update itinerary
  async acceptRequest(tripId, requestId) {
    const response = await fetch(`${API_URL}/trips/${tripId}/accept-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    })
    return response.json()
  },

  // Reject request
  async rejectRequest(tripId, requestId) {
    const res = await fetch(`${API_URL}/trips/${tripId}/requests/${requestId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to reject request');
    return res.json();
  },

  // Compare multiple requests using Google Places API
  async compareRequests(tripId, requestIds) {
    const response = await fetch(`${API_URL}/trips/${tripId}/compare-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestIds })
    })
    
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Comparison failed: ${response.status} ${response.statusText} ${text}`)
    }
    
    return response.json()
  }
}
