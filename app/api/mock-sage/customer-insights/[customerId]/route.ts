import { NextResponse } from "next/server";
import { MockSageX3Service } from "@/lib/erp";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const insights = MockSageX3Service.getCustomer360(customerId);
    return NextResponse.json({ success: true, source: "mock_sage_x3", data: insights });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch ERP customer insights" },
      { status: 500 }
    );
  }
}
