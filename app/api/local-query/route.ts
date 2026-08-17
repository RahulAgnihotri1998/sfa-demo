import { NextResponse } from "next/server";
import { pool, LocalQueryBuilder } from "@/lib/supabase/localDb";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, tableName, selectFields, filters, orderField, orderAsc, limitCount, isSingle, values, email, userId } = body;
    const cookieStore = await cookies();
    const sessionCookieName = "sfa-session-user-id";

    // Action: Login
    if (action === "login") {
      const res = await pool.query("SELECT id, email, role FROM users WHERE email = $1", [email]);
      const user = res.rows[0];
      if (user) {
        cookieStore.set(sessionCookieName, user.id, {
          path: "/",
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7,
        });
        cookieStore.set("sfa-session-user-role", user.role, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
        return NextResponse.json({ data: { user }, error: null });
      }
      return NextResponse.json({ data: null, error: "Invalid email" });
    }

    // Action: Logout
    if (action === "logout") {
      cookieStore.delete(sessionCookieName);
      cookieStore.delete("sfa-session-user-role");
      return NextResponse.json({ error: null });
    }

    // Action: Get User
    if (action === "user") {
      const storedId = cookieStore.get(sessionCookieName)?.value;
      if (!storedId) {
        return NextResponse.json({ data: { user: null }, error: null });
      }
      const res = await pool.query("SELECT id, email, role FROM users WHERE id = $1", [storedId]);
      const user = res.rows[0];
      return NextResponse.json({ data: { user: user || null }, error: null });
    }

    // Action: Database queries (select, insert, update)
    const builder = new LocalQueryBuilder(tableName);
    if (selectFields) builder.select(selectFields);
    if (orderField) builder.order(orderField, { ascending: orderAsc });
    if (limitCount) builder.limit(limitCount);
    if (isSingle) builder.single();
    
    if (filters && Array.isArray(filters)) {
      filters.forEach((f: any) => {
        if (f.op === "=") builder.eq(f.field, f.value);
        if (f.op === "!=") builder.neq(f.field, f.value);
        if (f.op === "IN") builder.in(f.field, f.value);
        if (f.op === "IS") builder.is(f.field, f.value);
      });
    }

    if (action === "insert") {
      builder.insert(values);
      const data = await builder.execute();
      return NextResponse.json({ data, error: null });
    }

    if (action === "update") {
      builder.update(values);
      const data = await builder.execute();
      return NextResponse.json({ data, error: null });
    }

    if (action === "delete") {
      builder.delete();
      const data = await builder.execute();
      return NextResponse.json({ data, error: null });
    }

    // Default select/execute action
    const data = await builder.execute();
    return NextResponse.json({ data, error: null });
  } catch (err: any) {
    console.error("Local query API error:", err);
    return NextResponse.json({ data: null, error: err.message || "Query execution failed" }, { status: 500 });
  }
}
