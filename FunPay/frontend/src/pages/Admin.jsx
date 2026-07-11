
import { useState } from "react";
import {
    Loader2,
    Package,
    Shield,
    ShieldCheck,
    Trash2,
    Users
} from "lucide-react";
import { useLanguage } from "../i18n";
import { useAuth } from "../auth/AuthContext";
import { ProtectedRoute } from "../components/ProtectedRoute";

// Mock data for demo
const mockUsers = [
    { id: 1, publicId: "admin1", nick: "AdminMaster", email: "admin@funpay.com", role: "admin", online: true },
    { id: 2, publicId: "progamer777", nick: "ProGamer777", email: "seller1@funpay.com", role: "seller", online: true },
    { id: 3, publicId: "boostking", nick: "BoostKing", email: "seller2@funpay.com", role: "seller", online: true },
    { id: 4, publicId: "casualplayer", nick: "CasualPlayer", email: "buyer1@funpay.com", role: "user", online: false }
];

const mockProducts = [
    { id: "1", title: "CS2 Prime Account Level 21+", seller: "ProGamer777", price: 450, status: "active" },
    { id: "2", title: "Valorant Boost to Diamond", seller: "BoostKing", price: 800, status: "active" },
    { id: "3", title: "Dota 2 Arcana Bundle", seller: "TradeVault", price: 2200, status: "active" },
    { id: "4", title: "Rust Full Account 2000hrs", seller: "RustLord", price: 1500, status: "paused" }
];

export function Admin() {
    return (
        <ProtectedRoute requiredRole="admin">
            <AdminPanel />
        </ProtectedRoute>
    );
}

function AdminPanel() {
    const { t } = useLanguage();
    const { token } = useAuth();
    const [users, setUsers] = useState(mockUsers);
    const [products, setProducts] = useState(mockProducts);
    const [tab, setTab] = useState("users");

    function handleRoleChange(userId, newRole) {
        // Replace with: adminUpdateUserRole(token, userId, newRole)
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    }

    function handleDeleteProduct(productId) {
        // Replace with: deleteProduct(token, productId)
        setProducts((prev) => prev.filter((p) => p.id !== productId));
    }

    return (
        <main className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6">
            <div className="flex items-center gap-3">
                <ShieldCheck size={24} className="text-[var(--accent-strong)]" />
                <h1 className="text-2xl font-black text-[var(--text)]">{t("admin.title")}</h1>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { label: t("admin.totalUsers"), value: users.length, icon: Users },
                    { label: t("admin.totalProducts"), value: products.length, icon: Package },
                    { label: t("admin.activeProducts"), value: products.filter((p) => p.status === "active").length, icon: Shield },
                    { label: t("admin.sellers"), value: users.filter((u) => u.role === "seller").length, icon: ShieldCheck }
                ].map(({ label, value, icon: Icon }) => (
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4" key={label}>
                        <Icon size={18} className="text-[var(--accent-strong)]" />
                        <div className="mt-2 text-2xl font-black text-[var(--text)]">{value}</div>
                        <div className="text-xs text-[var(--muted)]">{label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="mt-6 flex gap-1 border-b border-[var(--border)]">
                {["users", "products"].map((t_) => (
                    <button
                        className={`px-4 py-2.5 text-sm font-bold transition ${tab === t_ ? "border-b-2 border-[var(--accent)] text-[var(--accent-strong)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}
                        key={t_}
                        onClick={() => setTab(t_)}
                    >
                        {t(`admin.tab.${t_}`)}
                    </button>
                ))}
            </div>

            {/* Users table */}
            {tab === "users" ? (
                <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--muted)]">
                                <th className="px-3 py-3">{t("admin.user")}</th>
                                <th className="px-3 py-3">Email</th>
                                <th className="px-3 py-3">{t("admin.role")}</th>
                                <th className="px-3 py-3">{t("admin.status")}</th>
                                <th className="px-3 py-3">{t("admin.actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr className="border-b border-[var(--border)] hover:bg-[var(--surface-soft)]" key={u.id}>
                                    <td className="px-3 py-3">
                                        <a className="font-bold text-[var(--text)] hover:text-[var(--accent-strong)]" href={`/profile/${u.publicId}`}>{u.nick}</a>
                                    </td>
                                    <td className="px-3 py-3 text-[var(--muted)]">{u.email}</td>
                                    <td className="px-3 py-3">
                                        <span className="rounded-full bg-[var(--surface-strong)] px-2.5 py-0.5 text-xs font-bold text-[var(--accent-strong)]">
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`inline-flex items-center gap-1.5 text-xs ${u.online ? "text-emerald-400" : "text-[var(--muted)]"}`}>
                                            <span className={`size-2 rounded-full ${u.online ? "bg-emerald-400" : "bg-[var(--muted)]/40"}`} />
                                            {u.online ? t("profile.online") : t("profile.offline")}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        {u.role !== "admin" ? (
                                            <select
                                                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-bold text-[var(--text)]"
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                value={u.role}
                                            >
                                                <option value="user">user</option>
                                                <option value="seller">seller</option>
                                            </select>
                                        ) : (
                                            <span className="text-xs text-[var(--muted)]">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--muted)]">
                                <th className="px-3 py-3">{t("admin.product")}</th>
                                <th className="px-3 py-3">{t("admin.seller")}</th>
                                <th className="px-3 py-3">{t("admin.price")}</th>
                                <th className="px-3 py-3">{t("admin.status")}</th>
                                <th className="px-3 py-3">{t("admin.actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr className="border-b border-[var(--border)] hover:bg-[var(--surface-soft)]" key={p.id}>
                                    <td className="max-w-[200px] truncate px-3 py-3">
                                        <a className="font-bold text-[var(--text)] hover:text-[var(--accent-strong)]" href={`/product/${p.id}`}>{p.title}</a>
                                    </td>
                                    <td className="px-3 py-3 text-[var(--muted)]">{p.seller}</td>
                                    <td className="px-3 py-3 font-bold text-[var(--accent-strong)]">{p.price} ₴</td>
                                    <td className="px-3 py-3">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${p.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <button
                                            className="grid size-8 place-items-center rounded-lg text-red-400 transition hover:bg-red-500/10"
                                            onClick={() => handleDeleteProduct(p.id)}
                                            title={t("admin.delete")}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}