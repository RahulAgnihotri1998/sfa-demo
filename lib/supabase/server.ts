import { cookies } from "next/headers";
import { pool, LocalQueryBuilder } from "./localDb";

export async function createClient() {
  const cookieStore = await cookies();
  const sessionCookieName = "sfa-session-user-id";

  return {
    from(tableName: string) {
      return new LocalQueryBuilder(tableName);
    },
    auth: {
      async getUser() {
        const userId = cookieStore.get(sessionCookieName)?.value;
        if (!userId) {
          return { data: { user: null }, error: null };
        }

        try {
          const res = await pool.query("SELECT id, email, role FROM users WHERE id = $1", [userId]);
          const user = res.rows[0];
          if (user) {
            return { data: { user }, error: null };
          }
        } catch (err) {
          console.error("Local getUser query failed:", err);
        }
        return { data: { user: null }, error: null };
      },

      async signInWithPassword({ email, password }: { email: string; password?: string }) {
        try {
          const res = await pool.query("SELECT id, email, role FROM users WHERE email = $1", [email]);
          const user = res.rows[0];
          if (user) {
            // Set session cookie
            cookieStore.set(sessionCookieName, user.id, {
              path: "/",
              httpOnly: true,
              maxAge: 60 * 60 * 24 * 7, // 1 week
            });
            cookieStore.set("sfa-session-user-role", user.role, {
              path: "/",
              maxAge: 60 * 60 * 24 * 7,
            });
            return { data: { user }, error: null };
          }
        } catch (err) {
          console.error("Local signIn query failed:", err);
        }
        return { data: { user: null }, error: "Invalid email" };
      },

      async signOut() {
        cookieStore.delete(sessionCookieName);
        cookieStore.delete("sfa-session-user-role");
        return { error: null };
      },
    },

    channel(name: string) {
      return new MockChannel(name);
    },

    async removeChannel(channel: any) {
      channel.unsubscribe();
    },
  };
}

export function createAdminClient() {
  return {
    from(tableName: string) {
      return new LocalQueryBuilder(tableName);
    },
    auth: {
      async getUser() {
        return { data: { user: null }, error: null };
      },
    },
  };
}

class MockChannel {
  private callback: (() => void) | null = null;
  private timer: any = null;

  constructor(public name: string) {}

  on(event: string, filter: any, callback: () => void) {
    this.callback = callback;
    return this;
  }

  subscribe() {
    if (typeof window !== "undefined" && this.callback) {
      this.timer = setInterval(() => {
        if (this.callback) this.callback();
      }, 2000);
    }
    return this;
  }

  unsubscribe() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
