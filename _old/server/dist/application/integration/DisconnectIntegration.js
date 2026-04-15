export class DisconnectIntegration {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async execute(userId, provider) {
        await this.repo.delete(userId, provider);
    }
}
//# sourceMappingURL=DisconnectIntegration.js.map