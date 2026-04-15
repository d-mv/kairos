import { describe, it, expect, beforeEach } from "vitest";
import { CreateLink } from "../link/CreateLink.js";
import { InMemoryLinkRepository, SpyEventBus } from "./mocks.js";
describe("CreateLink use case", () => {
    let linkRepo;
    let eventBus;
    let createLink;
    beforeEach(() => {
        linkRepo = new InMemoryLinkRepository();
        eventBus = new SpyEventBus();
        createLink = new CreateLink(linkRepo, eventBus);
    });
    it("creates a blocks link and its inverse", async () => {
        const result = await createLink.execute({
            sourceId: "task-1",
            sourceType: "task",
            targetId: "task-2",
            targetType: "task",
            linkType: "blocks",
            userId: "u1",
        });
        expect(result.isOk).toBe(true);
        const [forward, inverse] = result.value;
        expect(forward.linkType).toBe("blocks");
        expect(inverse.linkType).toBe("blocked_by");
        expect(inverse.sourceId).toBe("task-2");
    });
    it("creates related_to symmetrically", async () => {
        const result = await createLink.execute({
            sourceId: "a",
            sourceType: "task",
            targetId: "b",
            targetType: "task",
            linkType: "related_to",
            userId: "u1",
        });
        const [forward, inverse] = result.value;
        expect(forward.linkType).toBe("related_to");
        expect(inverse.linkType).toBe("related_to");
    });
    it("publishes events for both links", async () => {
        await createLink.execute({
            sourceId: "a",
            sourceType: "task",
            targetId: "b",
            targetType: "task",
            linkType: "blocks",
            userId: "u1",
        });
        expect(eventBus.published).toHaveLength(2);
    });
    it("rejects self-links", async () => {
        const result = await createLink.execute({
            sourceId: "same",
            sourceType: "task",
            targetId: "same",
            targetType: "task",
            linkType: "blocks",
            userId: "u1",
        });
        expect(result.isErr).toBe(true);
    });
});
//# sourceMappingURL=CreateLink.test.js.map