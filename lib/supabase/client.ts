class ClientLocalQueryBuilder {
  private tableName: string;
  private selectFields: string = "*";
  private filters: Array<{ field: string; value: any; op: string }> = [];
  private orderField: string = "";
  private orderAsc: boolean = true;
  private limitCount: number = 0;
  private isSingle: boolean = false;

  private actionType: "select" | "insert" | "update" | "delete" = "select";
  private updateValues: Record<string, any> | null = null;
  private insertValues: Record<string, any> | Array<Record<string, any>> | null = null;
  private countOption: string | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields: string = "*", options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }) {
    this.selectFields = fields;
    if (options?.count) {
      this.countOption = options.count;
    }
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value, op: "=" });
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push({ field, value, op: "!=" });
    return this;
  }

  in(field: string, value: any[]) {
    this.filters.push({ field, value, op: "IN" });
    return this;
  }

  is(field: string, value: any) {
    this.filters.push({ field, value, op: "IS" });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAsc = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  update(values: Record<string, any>) {
    this.actionType = "update";
    this.updateValues = values;
    return this;
  }

  insert(values: Record<string, any> | Array<Record<string, any>>) {
    this.actionType = "insert";
    this.insertValues = values;
    return this;
  }

  delete() {
    this.actionType = "delete";
    return this;
  }

  private async apiCall() {
    try {
      const res = await fetch("/api/local-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: this.actionType,
          tableName: this.tableName,
          selectFields: this.selectFields,
          filters: this.filters,
          orderField: this.orderField,
          orderAsc: this.orderAsc,
          limitCount: this.limitCount,
          isSingle: this.isSingle,
          values: this.actionType === "insert" ? this.insertValues : this.updateValues,
        }),
      });
      return await res.json();
    } catch (err: any) {
      console.error(`Browser client API call failed for ${this.actionType}:`, err);
      return { data: null, error: err.message || "Request failed" };
    }
  }

  // Thenable signature to support await builder client-side
  async then(onfulfilled: (res: { data: any; count: number | null; error: any }) => any) {
    const res = await this.apiCall();
    const countVal = this.countOption ? (Array.isArray(res.data) ? res.data.length : 1) : null;
    return onfulfilled({ ...res, count: countVal });
  }
}

class MockClientChannel {
  private callback: (() => void) | null = null;
  private timer: any = null;

  constructor(public name: string) {}

  on(event: string, filter: any, callback: () => void) {
    this.callback = callback;
    return this;
  }

  subscribe() {
    if (this.callback) {
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

export function createClient() {
  return {
    from(tableName: string) {
      return new ClientLocalQueryBuilder(tableName);
    },
    auth: {
      async getUser() {
        try {
          const res = await fetch("/api/local-query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "user" }),
          });
          return await res.json();
        } catch (err) {
          console.error("Browser getUser failed:", err);
          return { data: { user: null }, error: err };
        }
      },

      async signInWithPassword({ email, password }: { email: string; password?: string }) {
        try {
          const res = await fetch("/api/local-query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "login", email, password }),
          });
          return await res.json();
        } catch (err) {
          return { data: { user: null }, error: err };
        }
      },

      async signOut() {
        try {
          const res = await fetch("/api/local-query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "logout" }),
          });
          return await res.json();
        } catch (err) {
          return { error: err };
        }
      },
    },

    channel(name: string) {
      return new MockClientChannel(name);
    },

    removeChannel(channel: any) {
      channel.unsubscribe();
    },
  };
}
