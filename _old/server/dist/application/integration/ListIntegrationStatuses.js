export class ListIntegrationStatuses {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async execute(userId) {
        const [googleConnection, todoistConnection] = await Promise.all([
            this.repo.findByProvider(userId, "google"),
            this.repo.findByProvider(userId, "todoist"),
        ]);
        const googleConnectedAt = googleConnection?.createdAt.toISOString() ?? null;
        return [
            {
                provider: "google_calendar",
                connected: Boolean(googleConnection),
                connectedAt: googleConnectedAt,
            },
            {
                provider: "google_drive",
                connected: Boolean(googleConnection),
                connectedAt: googleConnectedAt,
            },
            {
                provider: "todoist",
                connected: Boolean(todoistConnection),
                connectedAt: todoistConnection?.createdAt.toISOString() ?? null,
            },
        ];
    }
}
//# sourceMappingURL=ListIntegrationStatuses.js.map