import { randomUUID } from "node:crypto";
export class SaveTodoistToken {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async execute(userId, token) {
        const existing = await this.repo.findByProvider(userId, "todoist");
        const now = new Date();
        await this.repo.save({
            id: existing?.id ?? randomUUID(),
            provider: "todoist",
            userId,
            accessToken: token,
            refreshToken: null,
            scopes: [],
            expiresAt: null,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
        });
    }
}
//# sourceMappingURL=SaveTodoistToken.js.map