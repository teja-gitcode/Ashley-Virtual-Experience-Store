import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export const listBag = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{ product_id: string; qty: number }>`
      select product_id, qty from bag_items
      where user_id = ${context.userId}
      order by created_at desc
    `;
  });

export const upsertBagItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { productId: string; qty: number }) => {
    const productId = String(data?.productId ?? "").trim();
    const qty = Math.max(0, Math.min(12, Math.floor(Number(data?.qty) || 0)));
    if (!productId) throw new Error("Missing product");
    return { productId, qty };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.qty <= 0) {
      await sql`delete from bag_items where user_id = ${context.userId} and product_id = ${data.productId}`;
      return { ok: true as const };
    }
    await sql`
      insert into bag_items (user_id, product_id, qty)
      values (${context.userId}, ${data.productId}, ${data.qty})
      on conflict (user_id, product_id) do update set qty = excluded.qty
    `;
    return { ok: true as const };
  });
