const API_URL = import.meta.env.VITE_API_URL || '/api'

export const invitationService = {
  // Send invitation
  async sendInvitation(tripId, inviterEmail, inviteeEmail, tripName) {
    const res = await fetch(`${API_URL}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId, inviterEmail, inviteeEmail, tripName })
    })
    if (!res.ok) throw new Error('Failed to send invitation')
    const data = await res.json()
    return data.id
  },

  // Get user's pending invitations
  async getUserInvitations(userEmail) {
    const res = await fetch(`${API_URL}/invitations/user/${userEmail}`)
    if (!res.ok) throw new Error('Failed to get invitations')
    const data = await res.json()
    return data.map(inv => ({ id: inv._id, ...inv }))
  },

  // Listen to real-time invitations (simulate with polling)
  subscribeToInvitations(userEmail, callback) {
    let timeoutId;
    let isSubscribed = true;
    
    const poll = async () => {
      if (!isSubscribed) return;
      try {
        const res = await fetch(`${API_URL}/invitations/user/${userEmail}`);
        if (res.ok) {
          const data = await res.json();
          callback(data.map(inv => ({ id: inv._id, ...inv })));
        }
      } catch (e) {
        console.error('Error polling invitations:', e);
      }
      if (isSubscribed) {
        timeoutId = setTimeout(poll, 5000); // Poll every 5s
      }
    };
    
    poll();
    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
    };
  },

  // Accept invitation
  async acceptInvitation(invitationId, userId) {
    const res = await fetch(`${API_URL}/invitations/${invitationId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    if (!res.ok) throw new Error('Failed to accept invitation')
    const data = await res.json()
    return data.tripId
  },

  // Decline invitation
  async declineInvitation(invitationId) {
    const res = await fetch(`${API_URL}/invitations/${invitationId}/decline`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to decline invitation')
  },

  // Delete invitation
  async deleteInvitation(invitationId) {
    const res = await fetch(`${API_URL}/invitations/${invitationId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete invitation')
  }
}
