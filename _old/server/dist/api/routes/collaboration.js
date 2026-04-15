import { z } from "zod";
import * as container from "../container.js";
const shareEntityTypeSchema = z.union([
    z.literal("project"),
    z.literal("task"),
    z.literal("brain_folder"),
    z.literal("brain_page"),
]);
const createInviteSchema = z.object({
    recipientEmail: z.string().trim().email("Valid recipient email is required"),
    entityType: shareEntityTypeSchema,
    entityId: z.string().trim().min(1, "Entity id is required"),
});
export async function collaborationRoutes(fastify) {
    fastify.post("/invites", async (req, reply) => {
        const parsed = createInviteSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid collaboration invite payload" });
        }
        const result = await container.createCollaborationInvite.execute({
            senderUserId: req.userId,
            recipientEmail: parsed.data.recipientEmail,
            entityType: parsed.data.entityType,
            entityId: parsed.data.entityId,
        });
        if (result.isErr)
            return reply.status(400).send({ error: result.error });
        return reply.status(201).send({ ok: true });
    });
}
//# sourceMappingURL=collaboration.js.map