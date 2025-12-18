import { Users, Mail, Crown, UserPlus } from 'lucide-react'
import { useState } from 'react'
import InviteMemberModal from '../InviteMemberModal'

function MembersList({ trip }) {
  const [showInviteModal, setShowInviteModal] = useState(false)

  return (
    <div className="space-y-5 p-1">
      <InviteMemberModal 
        trip={trip} 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
      />

      {/* Invite Section */}
      <div className="rounded-xl p-5" style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid #334155' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: '#F8FAFC' }}>Trip Members</h3>
          <button
            onClick={() => setShowInviteModal(true)}
            className="text-sm px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all"
            style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)', color: '#00D4FF' }}
          >
            <UserPlus className="h-4 w-4" />
            Invite
          </button>
        </div>

        <div className="space-y-2">
          {trip.members?.map((member, idx) => {
            const memberEmail = typeof member === 'string' ? member : member.email || member.uid
            const memberRole = typeof member === 'object' ? member.role : (idx === 0 ? 'creator' : 'member')
            const initial = memberEmail ? memberEmail.charAt(0).toUpperCase() : '?'
            
            return (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl transition-all" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #00D4FF 100%)', color: 'white' }}>
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: '#F8FAFC' }}>{memberEmail || `Member ${idx + 1}`}</p>
                  <p className="text-xs flex items-center gap-1" style={{ color: '#94A3B8' }}>
                    {memberRole === 'creator' && (
                      <>
                        <Crown className="h-3 w-3" style={{ color: '#F59E0B' }} />
                        Creator
                      </>
                    )}
                    {memberRole === 'member' && 'Traveler'}
                  </p>
                </div>
                {idx === 0 && (
                  <Crown className="h-5 w-5" style={{ color: '#F59E0B' }} title="Trip Creator" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Pending Invitations */}
      <div className="rounded-xl p-5" style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid #334155' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#F8FAFC' }}>Pending Invitations</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" style={{ color: '#F59E0B' }} />
              <span className="text-sm" style={{ color: '#FCD34D' }}>2 invitations pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Member Permissions */}
      <div className="rounded-xl p-5" style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid #334155' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#F8FAFC' }}>Permissions</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
            <span style={{ color: '#94A3B8' }}>Suggest changes</span>
            <span className="font-medium" style={{ color: '#10B981' }}>All members</span>
          </div>
          <div className="flex justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
            <span style={{ color: '#94A3B8' }}>Accept/Reject requests</span>
            <span className="font-medium" style={{ color: '#00D4FF' }}>Creator only</span>
          </div>
          <div className="flex justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
            <span style={{ color: '#94A3B8' }}>Invite members</span>
            <span className="font-medium" style={{ color: '#10B981' }}>All members</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MembersList
