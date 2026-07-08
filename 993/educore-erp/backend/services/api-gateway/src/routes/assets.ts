import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db, withTenantContext } from '../db/connection';
import { vendors, assets } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { rbacGuard } from '../middleware/guards';

const VendorSchema = z.object({
  name: z.string().min(2),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  servicesProvided: z.string().optional(),
});

const AssetSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  vendorId: z.string().uuid().optional(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  valueRupees: z.number().min(0).optional(),
});

export async function assetsRoutes(fastify: FastifyInstance) {
  
  fastify.get('/vendors', {
    onRequest: [fastify.authenticate, rbacGuard(['INSTITUTION_ADMIN', 'ACCOUNTANT'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const data = await withTenantContext(user.tenantId, async (tx) => {
      return await tx.select().from(vendors).orderBy(desc(vendors.createdAt));
    });
    return reply.send({ success: true, data });
  });

  fastify.post('/vendors', {
    onRequest: [fastify.authenticate, rbacGuard(['INSTITUTION_ADMIN', 'ACCOUNTANT'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const parsed = VendorSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Validation failed' });
    
    try {
      const data = await withTenantContext(user.tenantId, async (tx) => {
        const [v] = await tx.insert(vendors).values({ tenantId: user.tenantId, ...parsed.data }).returning();
        return v;
      });
      return reply.code(201).send({ success: true, data });
    } catch (err) {
      return reply.code(500).send({ success: false, error: 'Internal error' });
    }
  });

  fastify.get('/', {
    onRequest: [fastify.authenticate, rbacGuard(['INSTITUTION_ADMIN', 'ACCOUNTANT'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const data = await withTenantContext(user.tenantId, async (tx) => {
      return await tx.select({
        id: assets.id,
        name: assets.name,
        category: assets.category,
        purchaseDate: assets.purchaseDate,
        valuePaise: assets.valuePaise,
        status: assets.status,
        vendorName: vendors.name,
      }).from(assets)
        .leftJoin(vendors, eq(assets.vendorId, vendors.id))
        .orderBy(desc(assets.createdAt));
    });
    return reply.send({ success: true, data });
  });

  fastify.post('/', {
    onRequest: [fastify.authenticate, rbacGuard(['INSTITUTION_ADMIN', 'ACCOUNTANT'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const parsed = AssetSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Validation failed' });
    
    try {
      const data = await withTenantContext(user.tenantId, async (tx) => {
        const [a] = await tx.insert(assets).values({
          tenantId: user.tenantId,
          name: parsed.data.name,
          category: parsed.data.category,
          vendorId: parsed.data.vendorId,
          purchaseDate: parsed.data.purchaseDate,
          valuePaise: parsed.data.valueRupees ? parsed.data.valueRupees * 100 : undefined,
        }).returning();
        return a;
      });
      return reply.code(201).send({ success: true, data });
    } catch (err) {
      return reply.code(500).send({ success: false, error: 'Internal error' });
    }
  });

}
