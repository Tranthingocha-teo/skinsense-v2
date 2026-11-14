"use client";

import { useState } from "react";
import { Wallet, ArrowDownRight, ArrowUpRight, DollarSign, Building2, CreditCard, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatVnd, type Shop, type WithdrawalRequest } from "@skinsense/domain";

export function SellerWallet({ shop }: { shop: Shop }) {
  const [balance, setBalance] = useState(shop.walletBalanceVnd || 15850000);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("MB Bank");
  const [accountNumber, setAccountNumber] = useState("97042211223344");
  const [accountHolder, setAccountHolder] = useState(shop.ownerName || "NGUYEN VAN A");
  const [openWithdrawModal, setOpenWithdrawModal] = useState(false);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([
    {
      id: "wd-001",
      shopId: shop.id,
      shopName: shop.shopName,
      amountVnd: 5000000,
      amountFormatted: formatVnd(5000000),
      bankName: "MB Bank",
      accountNumber: "97042211223344",
      accountHolder: shop.ownerName,
      status: "approved",
      createdAt: "2026-03-01T10:00:00.000Z",
      processedAt: "2026-03-01T14:30:00.000Z",
    },
  ]);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount <= 0 || amount > balance) return;

    const newReq: WithdrawalRequest = {
      id: `wd-${Date.now()}`,
      shopId: shop.id,
      shopName: shop.shopName,
      amountVnd: amount,
      amountFormatted: formatVnd(amount),
      bankName,
      accountNumber,
      accountHolder,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setBalance((prev) => prev - amount);
    setRequests((prev) => [newReq, ...prev]);
    setWithdrawAmount("");
    setOpenWithdrawModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Wallet Summary Card */}
      <Card className="border-border/80 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
                <Wallet className="size-7" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Số Dư Khả Dụng</span>
                <div className="text-3xl font-extrabold text-foreground pt-0.5">{formatVnd(balance)}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  Đã giải ngân tự động sau khi giao hàng thành công
                </p>
              </div>
            </div>

            <Dialog open={openWithdrawModal} onOpenChange={setOpenWithdrawModal}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md">
                  <ArrowUpRight className="size-4 mr-1.5" />
                  Yêu Cầu Rút Tiền
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground">
                    <Building2 className="size-5 text-emerald-600" />
                    Rút tiền về tài khoản ngân hàng
                  </DialogTitle>
                  <DialogDescription>
                    Số dư hiện tại: <strong className="text-emerald-600">{formatVnd(balance)}</strong>
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleWithdraw} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount">Số tiền cần rút (VNĐ)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Nhập số tiền (ví dụ: 1000000)"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      max={balance}
                      min={50000}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bank">Ngân hàng thụ hưởng</Label>
                    <Input id="bank" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="accountNo">Số tài khoản</Label>
                    <Input id="accountNo" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="holder">Tên chủ tài khoản (Viết hoa)</Label>
                    <Input id="holder" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} required />
                  </div>

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium pt-2">
                    Xác nhận rút tiền
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Transaction & Withdrawal History */}
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Lịch Sử Giao Dịch & Rút Tiền</CardTitle>
          <CardDescription>Danh sách yêu cầu rút tiền và luồng doanh thu đã ghi nhận</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-xl flex items-center justify-center ${
                    req.status === "approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                  }`}>
                    <ArrowUpRight className="size-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      Rút tiền về {req.bankName} ({req.accountNumber.slice(-4)})
                    </div>
                    <div className="text-xs text-muted-foreground pt-0.5">
                      {req.accountHolder} • {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-sm text-foreground">-{req.amountFormatted}</div>
                  <Badge variant="outline" className={`mt-1 text-[11px] ${
                    req.status === "approved"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}>
                    {req.status === "approved" ? "Đã chuyển khoản" : "Đang xử lý"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
