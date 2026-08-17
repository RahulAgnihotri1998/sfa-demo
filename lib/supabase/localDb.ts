import { Pool, types } from "pg";

// Parse PostgreSQL NUMERIC (oid 1700) as float
types.setTypeParser(1700, (val) => parseFloat(val));

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "root",
  database: "sfa_demo",
});

export { pool };

function compileWhereClauses(filters: any[], params: any[], tablePrefix: string = "") {
  if (filters.length === 0) return "";
  const clauses = filters.map((f) => {
    const prefix = tablePrefix ? `${tablePrefix}.` : "";
    if (f.op === "IN") {
      if (!Array.isArray(f.value) || f.value.length === 0) {
        return "1=0"; // Empty IN clause evaluates to false
      }
      const placeholders = f.value.map((val: any) => {
        params.push(val);
        return `$${params.length}`;
      });
      return `${prefix}"${f.field}" IN (${placeholders.join(", ")})`;
    } else if (f.op === "IS") {
      return `${prefix}"${f.field}" IS ${f.value === null ? "NULL" : f.value}`;
    } else {
      params.push(f.value);
      return `${prefix}"${f.field}" ${f.op} $${params.length}`;
    }
  });
  return ` WHERE ${clauses.join(" AND ")}`;
}

export class LocalQueryBuilder {
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

  private async executeUpdate() {
    const values = this.updateValues || {};
    const keys = Object.keys(values);
    const setClauses = keys.map((key, i) => `"${key}" = $${i + 1}`);
    const params = keys.map((key) => {
      const val = values[key];
      if (val !== null && typeof val === "object" && !(val instanceof Date)) {
        return JSON.stringify(val);
      }
      return val === undefined ? null : val;
    });

    let sql = `UPDATE "${this.tableName}" SET ${setClauses.join(", ")}`;
    sql += compileWhereClauses(this.filters, params);
    sql += " RETURNING *";

    const res = await pool.query(sql, params);
    return this.isSingle ? res.rows[0] : res.rows;
  }

  private async executeInsert() {
    const values = this.insertValues;
    if (!values) return [];
    
    const rows = Array.isArray(values) ? values : [values];
    if (rows.length === 0) return [];

    const keys = Object.keys(rows[0]);
    const fields = keys.map((k) => `"${k}"`).join(", ");
    
    const valuePlaceholders: string[] = [];
    const params: any[] = [];

    rows.forEach((row, rowIndex) => {
      const placeholders = keys.map((key) => {
        const val = row[key];
        const sanitized = val !== null && typeof val === "object" && !(val instanceof Date) ? JSON.stringify(val) : (val === undefined ? null : val);
        params.push(sanitized);
        return `$${params.length}`;
      });
      valuePlaceholders.push(`(${placeholders.join(", ")})`);
    });

    const sql = `INSERT INTO "${this.tableName}" (${fields}) VALUES ${valuePlaceholders.join(", ")} RETURNING *`;
    const res = await pool.query(sql, params);
    return Array.isArray(values) ? res.rows : res.rows[0];
  }

  private async executeDelete() {
    let sql = `DELETE FROM "${this.tableName}"`;
    const params: any[] = [];
    sql += compileWhereClauses(this.filters, params);
    sql += " RETURNING *";
    const res = await pool.query(sql, params);
    return this.isSingle ? res.rows[0] : res.rows;
  }

  async execute() {
    if (this.actionType === "insert") {
      return this.executeInsert();
    }
    if (this.actionType === "update") {
      return this.executeUpdate();
    }
    if (this.actionType === "delete") {
      return this.executeDelete();
    }

    const params: any[] = [];
    let sql = "";

    // 1. Check custom relational selects to bypass parsing
    if (this.tableName === "discount_requests" && this.selectFields.includes("requester:users")) {
      sql = `
        SELECT dr.*, u.full_name as requester_full_name
        FROM discount_requests dr
        LEFT JOIN users u ON dr.requested_by = u.id
      `;
      sql += compileWhereClauses(this.filters, params, "dr");
      sql += ` ORDER BY dr.created_at DESC`;
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        requester: { full_name: row.requester_full_name }
      }));
    }

    if (this.tableName === "follow_ups" && this.selectFields.includes("customer:customers")) {
      sql = `
        SELECT f.*, c.name as customer_name
        FROM follow_ups f
        LEFT JOIN customers c ON f.customer_id = c.id
      `;
      sql += compileWhereClauses(this.filters, params, "f");
      if (this.orderField) {
        sql += ` ORDER BY f."${this.orderField}" ${this.orderAsc ? "ASC" : "DESC"}`;
      }
      if (this.limitCount) {
        sql += ` LIMIT ${this.limitCount}`;
      }
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        customer: { name: row.customer_name }
      }));
    }

    if (this.tableName === "product_alternatives" && this.selectFields.includes("alternative:products")) {
      sql = `
        SELECT pa.product_id, p.*
        FROM product_alternatives pa
        LEFT JOIN products p ON pa.alternative_product_id = p.id
      `;
      sql += compileWhereClauses(this.filters, params, "pa");
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        product_id: row.product_id,
        alternative: { ...row, product_id: undefined }
      }));
    }

    if (this.tableName === "product_recommendations" && this.selectFields.includes("recommended:products")) {
      sql = `
        SELECT pr.product_id, pr.reason, p.*
        FROM product_recommendations pr
        LEFT JOIN products p ON pr.recommended_product_id = p.id
      `;
      sql += compileWhereClauses(this.filters, params, "pr");
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        product_id: row.product_id,
        reason: row.reason,
        recommended: { ...row, product_id: undefined }
      }));
    }

    if (this.tableName === "customer_pricing" && this.selectFields.includes("product:products")) {
      sql = `
        SELECT cp.*, p.name as product_name, p.sku as product_sku
        FROM customer_pricing cp
        LEFT JOIN products p ON cp.product_id = p.id
      `;
      sql += compileWhereClauses(this.filters, params, "cp");
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        product: { name: row.product_name, sku: row.product_sku }
      }));
    }

    if (this.tableName === "purchase_history" && this.selectFields.includes("product:products(name)")) {
      sql = `
        SELECT ph.*, p.name as product_name
        FROM purchase_history ph
        LEFT JOIN products p ON ph.product_id = p.id
      `;
      sql += compileWhereClauses(this.filters, params, "ph");
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        product: { name: row.product_name }
      }));
    }

    if (this.tableName === "customer_pricing" && this.selectFields.includes("product:products")) {
      sql = `
        SELECT cp.*, p.name as product_name, p.sku as product_sku
        FROM customer_pricing cp
        LEFT JOIN products p ON cp.product_id = p.id
      `;
      sql += compileWhereClauses(this.filters, params, "cp");
      if (this.orderField) {
        sql += ` ORDER BY cp."${this.orderField}" ${this.orderAsc ? "ASC" : "DESC"}`;
      }
      if (this.limitCount) {
        sql += ` LIMIT ${this.limitCount}`;
      }
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        product: { name: row.product_name, sku: row.product_sku }
      }));
    }

    if (this.tableName === "purchase_history" && (this.selectFields.includes("customer:customers") || this.selectFields.includes("product:products"))) {
      // Alerts & Customer 360 query
      sql = `
        SELECT ph.*, c.name as customer_name, p.name as product_name
        FROM purchase_history ph
        LEFT JOIN customers c ON ph.customer_id = c.id
        LEFT JOIN products p ON ph.product_id = p.id
      `;
      sql += compileWhereClauses(this.filters, params, "ph");
      if (this.orderField) {
        sql += ` ORDER BY ph."${this.orderField}" ${this.orderAsc ? "ASC" : "DESC"}`;
      }
      if (this.limitCount) {
        sql += ` LIMIT ${this.limitCount}`;
      }
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        customer: { name: row.customer_name },
        product: { name: row.product_name }
      }));
    }

    if (this.tableName === "visit_product_audits" && this.selectFields.includes("product:products")) {
      sql = `
        SELECT va.*, p.name as product_name, p.sku as product_sku, p.base_price as product_base_price
        FROM visit_product_audits va
        LEFT JOIN products p ON va.product_id = p.id
      `;
      sql += compileWhereClauses(this.filters, params, "va");
      if (this.orderField) {
        sql += ` ORDER BY va."${this.orderField}" ${this.orderAsc ? "ASC" : "DESC"}`;
      }
      if (this.limitCount) {
        sql += ` LIMIT ${this.limitCount}`;
      }
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        product: {
          id: row.product_id,
          name: row.product_name,
          sku: row.product_sku,
          base_price: row.product_base_price,
        }
      }));
    }

    if (this.tableName === "document_shares" && this.selectFields.includes("document:documents")) {
      sql = `
        SELECT ds.*, d.title as document_title
        FROM document_shares ds
        LEFT JOIN documents d ON ds.document_id = d.id
      `;
      sql += compileWhereClauses(this.filters, params, "ds");
      sql += ` ORDER BY ds.sent_at DESC`;
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        document: { title: row.document_title }
      }));
    }

    if (this.tableName === "order_items" && this.selectFields.includes("product:products")) {
      sql = `
        SELECT oi.*, p.name as product_name
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
      `;
      sql += compileWhereClauses(this.filters, params, "oi");
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        product: { name: row.product_name }
      }));
    }

    if (this.tableName === "leads" && this.selectFields.includes("owner:users")) {
      sql = `
        SELECT l.*, u.full_name as owner_name
        FROM leads l
        LEFT JOIN users u ON l.owner_id = u.id
      `;
      sql += compileWhereClauses(this.filters, params, "l");
      if (this.orderField) {
        sql += ` ORDER BY l."${this.orderField}" ${this.orderAsc ? "ASC" : "DESC"}`;
      }
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        owner: { full_name: row.owner_name }
      }));
    }

    if (this.tableName === "visits" && (this.selectFields.includes("customer:customers") || this.selectFields.includes("customer"))) {
      sql = `
        SELECT v.*, 
               c.name as customer_name,
               c.territory as customer_territory,
               c.address as customer_address,
               c.contact_name as customer_contact_name,
               c.contact_phone as customer_contact_phone,
               c.contact_email as customer_contact_email,
               c.latitude as customer_latitude,
               c.longitude as customer_longitude,
               c.geofence_radius_m as customer_geofence_radius_m,
               c.parent_id as customer_parent_id,
               c.open_items_amount as customer_open_items_amount,
               u.full_name as sales_rep_name
        FROM visits v
        LEFT JOIN customers c ON v.customer_id = c.id
        LEFT JOIN users u ON v.sales_rep_id = u.id
      `;
      sql += compileWhereClauses(this.filters, params, "v");
      if (this.orderField) {
        sql += ` ORDER BY v."${this.orderField}" ${this.orderAsc ? "ASC" : "DESC"}`;
      }
      if (this.limitCount) {
        sql += ` LIMIT ${this.limitCount}`;
      }
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        sales_rep_name: row.sales_rep_name,
        customer: {
          id: row.customer_id,
          name: row.customer_name,
          territory: row.customer_territory,
          address: row.customer_address,
          contact_name: row.customer_contact_name,
          contact_phone: row.customer_contact_phone,
          contact_email: row.customer_contact_email,
          latitude: row.customer_latitude,
          longitude: row.customer_longitude,
          geofence_radius_m: row.customer_geofence_radius_m,
          parent_id: row.customer_parent_id,
          open_items_amount: row.customer_open_items_amount,
        }
      }));
    }

    if (this.tableName === "orders" && this.selectFields.includes("order_items")) {
      sql = `
        SELECT o.*, c.name as customer_name, c.territory as customer_territory
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
      `;
      sql += compileWhereClauses(this.filters, params, "o");
      if (this.orderField) {
        sql += ` ORDER BY o."${this.orderField}" ${this.orderAsc ? "ASC" : "DESC"}`;
      }
      if (this.limitCount) {
        sql += ` LIMIT ${this.limitCount}`;
      }
      const res = await pool.query(sql, params);
      
      const orderIds = res.rows.map(r => r.id);
      let itemsMap: Record<string, any[]> = {};
      
      if (orderIds.length > 0) {
        const itemsSql = `
          SELECT oi.order_id, oi.quantity, oi.unit_price, oi.line_total, p.name as product_name
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id IN (${orderIds.map((_, i) => `$${i + 1}`).join(", ")})
        `;
        const itemsRes = await pool.query(itemsSql, orderIds);
        itemsRes.rows.forEach(item => {
          if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
          itemsMap[item.order_id].push({
            quantity: item.quantity,
            unit_price: Number(item.unit_price || 0),
            line_total: Number(item.line_total || 0),
            product: { name: item.product_name }
          });
        });
      }

      return res.rows.map((row) => ({
        ...row,
        customer: { name: row.customer_name, territory: row.customer_territory },
        order_items: itemsMap[row.id] || []
      }));
    }

    if (this.tableName === "orders" && this.selectFields.includes("customer:customers")) {
      sql = `
        SELECT o.*, c.name as customer_name, u.full_name as sales_rep_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN users u ON o.sales_rep_id = u.id
      `;
      sql += compileWhereClauses(this.filters, params, "o");
      if (this.orderField) {
        sql += ` ORDER BY o."${this.orderField}" ${this.orderAsc ? "ASC" : "DESC"}`;
      }
      if (this.limitCount) {
        sql += ` LIMIT ${this.limitCount}`;
      }
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        customer: { name: row.customer_name },
        sales_rep: { full_name: row.sales_rep_name }
      }));
    }

    // 2. Standard queries without complex relations
    let cleanedSelect = this.selectFields;
    if (cleanedSelect !== "*") {
      cleanedSelect = cleanedSelect.replace(/,[^,]+\([^)]+\)/g, "");
    }

    sql = `SELECT ${cleanedSelect} FROM "${this.tableName}"`;
    sql += compileWhereClauses(this.filters, params);

    if (this.orderField) {
      sql += ` ORDER BY "${this.orderField}" ${this.orderAsc ? "ASC" : "DESC"}`;
    }

    if (this.limitCount) {
      sql += ` LIMIT ${this.limitCount}`;
    }

    const res = await pool.query(sql, params);
    
    if (this.isSingle) {
      return res.rows[0] || null;
    }
    return res.rows;
  }

  // Thenable signature to support await builder
  async then(onfulfilled: (res: { data: any; count: number | null; error: any }) => any) {
    try {
      const data = await this.execute();
      const countVal = this.countOption ? (Array.isArray(data) ? data.length : 1) : null;
      return onfulfilled({ data, count: countVal, error: null });
    } catch (err: any) {
      console.error("Local database query failed:", err);
      return onfulfilled({ data: null, count: null, error: err });
    }
  }
}
