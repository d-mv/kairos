import type { FastifyInstance } from 'fastify';
import * as container from '../container.js';

export async function areaRoutes(fastify: FastifyInstance) {
  // GET /api/v1/areas
  fastify.get('/', async (req, reply) => {
    const result = await container.listAreas.execute(req.userId);
    return result.isOk ? result.value : reply.status(500).send({ error: result.error });
  });

  // POST /api/v1/areas
  fastify.post<{ Body: { name: string } }>('/', async (req, reply) => {
    const result = await container.createArea.execute({
      name: req.body.name,
      userId: req.userId,
    });
    if (result.isErr) return reply.status(400).send({ error: result.error });
    return reply.status(201).send(result.value);
  });

  // GET /api/v1/areas/:id
  fastify.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const areas = await container.listAreas.execute(req.userId);
    if (areas.isErr) return reply.status(500).send({ error: areas.error });
    const area = areas.value.find(a => a.id === req.params.id);
    if (!area) return reply.status(404).send({ error: 'Area not found' });
    return area;
  });

  // PUT /api/v1/areas/:id
  fastify.put<{ Params: { id: string }; Body: { name: string } }>('/:id', async (req, reply) => {
    const result = await container.updateArea.execute({
      id: req.params.id,
      userId: req.userId,
      name: req.body.name,
    });
    if (result.isErr) return reply.status(400).send({ error: result.error });
    return result.value;
  });

  // DELETE /api/v1/areas/:id
  fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const result = await container.deleteArea.execute({
      id: req.params.id,
      userId: req.userId,
    });
    if (result.isErr) return reply.status(404).send({ error: result.error });
    return reply.status(204).send();
  });
}
