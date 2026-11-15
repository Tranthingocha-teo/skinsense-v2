import { NextResponse } from "next/server";

export interface ProductItem {
  id: string;
  name: string;
  shopName: string;
  price: number;
  category: string;
  status: "approved" | "pending" | "rejected";
  submittedAt: string;
  stock: number;
}

// In-memory persistent state (shared across requests in dev/prod runtime)
let PRODUCTS_STORE: ProductItem[] = [
  {
    id: "prod_01",
    name: "Kem dưỡng giảm mụn phục hồi La Roche-Posay Effaclar Duo+M 40ml",
    shopName: "La Roche-Posay VN Flagship",
    price: 495000,
    category: "Trị mụn & Phục hồi",
    status: "approved",
    submittedAt: "2026-11-01",
    stock: 150,
  },
  {
    id: "prod_02",
    name: "Sữa rửa mặt dưỡng ẩm chuyên sâu CeraVe Hydrating Cleanser 473ml",
    shopName: "CeraVe Skincare Official",
    price: 380000,
    category: "Làm sạch & Cân bằng pH",
    status: "pending",
    submittedAt: "2026-11-08",
    stock: 200,
  },
  {
    id: "prod_03",
    name: "Mặt nạ đất sét tro núi lửa Innisfree Super Volcanic Pore Clay 100ml",
    shopName: "Innisfree Beauty Hub",
    price: 290000,
    category: "Mặt nạ hút dầu & Se khít lỗ chân lông",
    status: "pending",
    submittedAt: "2026-11-09",
    stock: 80,
  },
  {
    id: "prod_04",
    name: "Serum chống oxy hóa phục hồi Vitamin C 15% Pure Active 30ml",
    shopName: "La Roche-Posay VN Flagship",
    price: 920000,
    category: "Chống lão hóa & Sáng da mờ thâm",
    status: "approved",
    submittedAt: "2026-10-25",
    stock: 65,
  },
  {
    id: "prod_05",
    name: "Gel dưỡng ẩm kiểm soát dầu Bioderma Sébium Mat Control 30ml",
    shopName: "Bioderma Vietnam Official",
    price: 425000,
    category: "Kiểm soát dầu & Mờ bóng nhờn",
    status: "approved",
    submittedAt: "2026-11-05",
    stock: 120,
  },
];

export async function GET() {
  return NextResponse.json({ ok: true, products: PRODUCTS_STORE });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, shopName, price, category, stock } = body;

    const newProd: ProductItem = {
      id: `prod_${Date.now()}`,
      name: name?.trim() || "Sản phẩm dược mỹ phẩm mới",
      shopName: shopName?.trim() || "Cửa Hàng Đối Tác SkinSense",
      price: Number(price) || 350000,
      category: category?.trim() || "Chăm sóc da chuyên sâu",
      status: "pending",
      submittedAt: new Date().toISOString().split("T")[0],
      stock: Number(stock) || 100,
    };

    PRODUCTS_STORE = [newProd, ...PRODUCTS_STORE];
    return NextResponse.json({ ok: true, product: newProd });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Thêm sản phẩm thất bại" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { productId, status } = body; // "approved" | "rejected" | "pending"

    if (!productId || !status) {
      return NextResponse.json({ error: "Thiếu productId hoặc status." }, { status: 400 });
    }

    PRODUCTS_STORE = PRODUCTS_STORE.map((p) => (p.id === productId ? { ...p, status } : p));
    return NextResponse.json({ ok: true, message: `Đã cập nhật trạng thái sản phẩm thành ${status}` });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Cập nhật thất bại" }, { status: 500 });
  }
}
