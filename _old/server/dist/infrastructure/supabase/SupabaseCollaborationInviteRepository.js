function toInvite(row) {
    return {
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        entityLabel: row.entity_label,
        senderUserId: row.sender_user_id,
        senderEmail: row.sender_email,
        recipientUserId: row.recipient_user_id,
        recipientEmail: row.recipient_email,
        status: row.status,
        expiresAt: new Date(row.expires_at),
        createdAt: new Date(row.created_at),
        respondedAt: row.responded_at ? new Date(row.responded_at) : null,
    };
}
export class SupabaseCollaborationInviteRepository {
    client;
    constructor(client) {
        this.client = client;
    }
    async findPendingByRecipientUserId(userId) {
        const { data, error } = await this.client
            .from("collaboration_invites")
            .select("*")
            .eq("recipient_user_id", userId)
            .eq("status", "pending")
            .order("created_at", { ascending: false });
        if (error || !data)
            return [];
        return data.map(toInvite);
    }
    async findPendingByRecipientAndEntity(userId, entityType, entityId) {
        const { data, error } = await this.client
            .from("collaboration_invites")
            .select("*")
            .eq("recipient_user_id", userId)
            .eq("entity_type", entityType)
            .eq("entity_id", entityId)
            .eq("status", "pending")
            .maybeSingle();
        if (error || !data)
            return null;
        return toInvite(data);
    }
    async findById(id) {
        const { data, error } = await this.client
            .from("collaboration_invites")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error || !data)
            return null;
        return toInvite(data);
    }
    async save(invite) {
        const { error } = await this.client.from("collaboration_invites").upsert({
            id: invite.id,
            entity_type: invite.entityType,
            entity_id: invite.entityId,
            entity_label: invite.entityLabel,
            sender_user_id: invite.senderUserId,
            sender_email: invite.senderEmail,
            recipient_user_id: invite.recipientUserId,
            recipient_email: invite.recipientEmail,
            status: invite.status,
            expires_at: invite.expiresAt.toISOString(),
            created_at: invite.createdAt.toISOString(),
            responded_at: invite.respondedAt?.toISOString() ?? null,
        });
        if (error)
            throw new Error(`Failed to save collaboration invite: ${error.message}`);
    }
}
//# sourceMappingURL=SupabaseCollaborationInviteRepository.js.map