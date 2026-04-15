import Fastify from "fastify";
declare module "fastify" {
    interface FastifyRequest {
        userId: string;
    }
}
declare function authPlugin(fastify: ReturnType<typeof Fastify>): Promise<void>;
declare const _default: typeof authPlugin;
export default _default;
//# sourceMappingURL=auth.d.ts.map