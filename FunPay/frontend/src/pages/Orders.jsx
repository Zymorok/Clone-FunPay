
import { useState, useEffect } from "react";
import {
    Check,
    Clock,
    Inbox,
    Loader2,
    MessageCircle,
    Package,
    X,
    XCircle
} from "lucide-react";
import { useLanguage } from "../i18n";
import { useAuth } from "../auth/AuthContext";
import { ProtectedRoute } from "../components/ProtectedRoute";

// Mock orders for demo
const mockOrders = [
    {
        id: "ord-1",
        product: { id: "1", title: "CS2 Prime Account Level 21+", price: 450, currency: "UAH" },
        buyer: { publicId: "casualplayer", nick: "CasualPlayer" },
        seller: { publicId: "progamer777", nick: "ProGamer777" },
        status: "pending",
        message: "I want to buy this account. Ready to pay now.",
        createdAt: "2025-07-10"
    },
    {
        id: "ord-2",
        product: { id: "2", title: "Valorant Boost to Diamond", price: 800, currency: "UAH" },
        buyer: { publicId: "casualplayer", nick: "CasualPlayer" },
        seller: { publicId: "boostking", nick: "BoostKing" },
        status: "completed",
        message: "Interested in duo boost. When can you start?",
        createdAt: "2025-07-08"
    }
];

export function Orders() {
    return (
        <ProtectedRoute>
            <OrdersPage />
        </ProtectedRoute>
    );
}

function OrdersPage() {
    const { t } = useLanguage();
    const { user, token } = useAuth();
    const [orders, setOrders] = useState(mockOrders);
    const [isLoading, setIsLoading] = useState(false);
    const [tab, setTab] = useState("buyer");

    const isSeller = user?.role === "seller" || user?.role === "admin";

    // Replace with real API call:
    // useEffect(() => { getMyOrders(token, { role: tab }).then(setOrders); }, [tab]);

    const filteredOrders = orders.filter((o) =>
        tab === "buyer" ? o.buyer.publicId === user?.publicId : o.seller.publicId === user?.publicId
    );

    function handleUpdateStatus(orderId, status) {
        // Replace with: updateOrderStatus(token, orderId, status)
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    }

    const statusConfig = {
        pending: { icon: Clock, label: t("orders.pending"), color: "text-amber-400 bg-amber-500/10" },
        completed: { icon: Check, label: t("orders.completed"), color: "text-emerald-400 bg-emerald-500/10" },
        rejected: { icon: XCircle, label: t("orders.rejected"), color: "text-red-400 bg-red-500/10" }
    };

    return (
        <main className="mx-auto max-w-[800px] px-4 py-6 sm:px-6">
            <h1 className="text-2xl font-black text-[var(--text)]">{t("orders.title")}</h1>

            {isSeller ? (
                <div className="mt-5 flex gap-1 border-b border-[var(--border)]">
                    {["buyer", "seller"].map((t_) => (
                        <button
                            className={`px-4 py-2.5 text-sm font-bold transition ${tab === t_ ? "border-b-2 border-[var(--accent)] text-[var(--accent-strong)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
                            key={t_}
                            onClick={() => setTab(t_)}
                        >
                            {t(`orders.tab.${t_}`)}
                        </button>
                    ))}
                </div>
            ) : null}

            <div className="mt-6">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
                        <Inbox size={32} className="mx-auto mb-3 text-[var(--muted)]" />
                        <p className="text-sm text-[var(--muted)]">{t("orders.empty")}</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredOrders.map((order) => {
                            const sc = statusConfig[order.status] || statusConfig.pending;
                            const StatusIcon = sc.icon;
                            return (
                                <div
                                    className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
                                    key={order.id}
                                >
                                    <div className="flex-1 min-w-0">
                                        <a className="text-sm font-bold text-[var(--text)] hover:text-[var(--accent-strong)]" href={`/product/${order.product.id}`}>
                                            {order.product.title}
                                        </a>
                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                                            <span>{tab === "buyer" ? `${t("orders.seller")}: ${order.seller.nick}` : `${t("orders.buyer")}: ${order.buyer.nick}`}</span>
                                            <span>{order.createdAt}</span>
                                            {order.message ? (
                                                <span className="inline-flex items-center gap-1"><MessageCircle size={12} /> "{order.message.slice(0, 40)}..."</span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${sc.color}`}>
                                        <StatusIcon size={13} />
                                        {sc.label}
                                    </span>

                                    {tab === "seller" && order.status === "pending" ? (
                                        <div className="flex gap-2">
                                            <button
                                                className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400 transition hover:bg-emerald-500/20"
                                                onClick={() => handleUpdateStatus(order.id, "completed")}
                                                title={t("orders.approve")}
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                className="grid size-8 place-items-center rounded-lg bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                                                onClick={() => handleUpdateStatus(order.id, "rejected")}
                                                title={t("orders.reject")}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : null}

                                    <span className="text-sm font-black text-[var(--accent-strong)]">
                                        {order.product.price} {order.product.currency}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}