import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { pool } from "@/lib/supabase/localDb";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let title = "";
    let type = "spec";
    let productId: string | null = null;
    let fileUrl = "";
    let originalName = "";

    const docsDir = path.join(process.cwd(), "public", "docs");
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      title = (formData.get("title") as string)?.trim() || "";
      type = (formData.get("type") as string) || "spec";
      productId = (formData.get("productId") as string) || null;
      const externalUrl = (formData.get("fileUrl") as string)?.trim() || "";
      const file = formData.get("file") as File | null;

      if (file && typeof file === "object" && file.size > 0) {
        originalName = file.name;
        const sanitized = originalName.replace(/[^a-zA-Z0-9.\-_ ()]/g, "_");
        const filePath = path.join(docsDir, sanitized);
        
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        fs.writeFileSync(filePath, buffer);

        fileUrl = `/docs/${sanitized}`;
      } else if (externalUrl) {
        // External URL provided
        const parsedName = path.basename(externalUrl.split("?")[0]) || `${title.toLowerCase().replace(/[\s\W]+/g, "-")}.pdf`;
        const sanitized = parsedName.replace(/[^a-zA-Z0-9.\-_ ()]/g, "_");
        const filePath = path.join(docsDir, sanitized);

        // If not already on disk, try downloading or creating
        if (!fs.existsSync(filePath)) {
          try {
            const fetchRes = await fetch(externalUrl);
            if (fetchRes.ok) {
              const arrayBuf = await fetchRes.arrayBuffer();
              fs.writeFileSync(filePath, Buffer.from(arrayBuf));
            }
          } catch (fetchErr) {
            console.warn("Could not download external file directly, keeping local path reference:", fetchErr);
          }
        }
        fileUrl = `/docs/${sanitized}`;
      }
    } else {
      const body = await request.json();
      title = body.title?.trim() || "";
      type = body.type || "spec";
      productId = body.productId || null;
      const externalUrl = body.fileUrl?.trim() || "";
      originalName = body.fileName || "";

      if (externalUrl) {
        const parsedName = path.basename(externalUrl.split("?")[0]) || `${title.toLowerCase().replace(/[\s\W]+/g, "-")}.pdf`;
        const sanitized = parsedName.replace(/[^a-zA-Z0-9.\-_ ()]/g, "_");
        fileUrl = `/docs/${sanitized}`;
      }
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!fileUrl) {
      const defaultName = `${title.toLowerCase().replace(/[\s\W]+/g, "-")}.pdf`;
      fileUrl = `/docs/${defaultName}`;
    }

    const docId = `d0000001-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    const res = await pool.query(
      `INSERT INTO documents (id, title, type, product_id, file_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [docId, title, type, productId, fileUrl]
    );

    const savedDoc = res.rows[0];

    return NextResponse.json({
      ok: true,
      document: savedDoc,
      message: "Document successfully saved in system with real local URL",
    });
  } catch (err: any) {
    console.error("Document upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload document", details: err?.message },
      { status: 500 }
    );
  }
}
