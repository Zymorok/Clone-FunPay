
import { useState, useEffect } from "react";
import { ArrowLeft, Check, Loader2, Plus } from "lucide-react";
import { useLanguage } from "../i18n";
import { useAuth } from "../auth/AuthContext";
import { ProtectedRoute } from "../components/ProtectedRoute";

const games = [
    "Counter-Strike 2", "Valorant", "Dota 2", "Rust", "Albion Online",
    "Grand Theft Auto V", "Minecraft", "Genshin Impact", "World of Warcraft",
    "Apex Legends", "League of Legends", "Escape from Tarkov"
];

const categoryOptions = [
    "accounts", "services", "training", "subscription", "currency",
    "donate", "items", "keys", "other"
];

export function CreateProduct() {
    return (
        <ProtectedRoute requiredRole={null}>
            <CreateProductForm />
        </ProtectedRoute>
    );
}

function CreateProductForm() {
    const { t } = useLanguage();
    const { user, token } = useAuth();

    // Determine if editing (has product ID in URL)
    const pathParts = window.location.pathname.split("/");
    const isEdit = pathParts.includes("edit");
    const productId = isEdit ? pathParts[pathParts.indexOf("product") + 1] : null;

    const [title, setTitle] = useState("");
    const [game, setGame] = useState(games[0]);
    const [category, setCategory] = useState(categoryOptions[0]);
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [status, setStatus] = useState("active");
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isEdit && productId) {
            // Replace with: getProductById(productId) to prefill form
            // For demo, leave empty
        }
    }, [isEdit, productId]);

    // Block non-sellers from creating
    if (user?.role === "user" || (!user?.role && user)) {
        return (
            <main className="flex min-h-[50vh] items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-[var(--text)]">{t("createProduct.sellersOnly")}</h1>
                    <p className="mt-2 text-sm text-[var(--muted)]">{t("createProduct.sellersOnlyText")}</p>
                </div>
            </main>
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSaved(false);

        const payload = { title, game, category, description, price: Number(price), status };

        try {
            if (isEdit) {
                // Replace with: updateProduct(token, productId, payload)
            } else {
                // Replace with: createProduct(token, payload)
            }
            await new Promise((r) => setTimeout(r, 600));
            setSaved(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main className="mx-auto max-w-[600px] px-4 py-6 sm:px-6">
            <a className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--link)]" href="/catalog">
                <ArrowLeft size={16} /> {t("createProduct.back")}
            </a>

            <h1 className="text-2xl font-black text-[var(--text)]">
                {isEdit ? t("createProduct.editTitle") : t("createProduct.createTitle")}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{t("createProduct.subtitle")}</p>

            <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
                <label className="grid gap-1.5">
                    <span className="text-[13px] font-extrabold text-[var(--text)]">{t("createProduct.titleLabel")}</span>
                    <input
                        className="field"
                        maxLength={120}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t("createProduct.titlePlaceholder")}
                        required
                        value={title}
                    />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5">
                        <span className="text-[13px] font-extrabold text-[var(--text)]">{t("createProduct.game")}</span>
                        <select className="field" onChange={(e) => setGame(e.target.value)} value={game}>
                            {games.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </label>
                    <label className="grid gap-1.5">
                        <span className="text-[13px] font-extrabold text-[var(--text)]">{t("createProduct.category")}</span>
                        <select className="field" onChange={(e) => setCategory(e.target.value)} value={category}>
                            {categoryOptions.map((c) => <option key={c} value={c}>{t(`catalog.categories.${c}`)}</option>)}
                        </select>
                    </label>
                </div>

                <label className="grid gap-1.5">
                    <span className="text-[13px] font-extrabold text-[var(--text)]">{t("createProduct.description")}</span>
                    <textarea
                        className="field min-h-[140px] resize-y"
                        maxLength={2000}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t("createProduct.descriptionPlaceholder")}
                        required
                        value={description}
                    />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5">
                        <span className="text-[13px] font-extrabold text-[var(--text)]">{t("createProduct.price")} (UAH)</span>
                        <input
                            className="field"
                            min="1"
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="100"
                            required
                            type="number"
                            value={price}
                        />
                    </label>
                    <label className="grid gap-1.5">
                        <span className="text-[13px] font-extrabold text-[var(--text)]">{t("createProduct.status")}</span>
                        <select className="field" onChange={(e) => setStatus(e.target.value)} value={status}>
                            <option value="active">{t("product.active")}</option>
                            <option value="paused">{t("product.paused")}</option>
                        </select>
                    </label>
                </div>

                {error ? (
                    <p className="rounded-lg border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
                        {error}
                    </p>
                ) : null}

                {saved ? (
                    <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400">
                        <Check size={16} /> {isEdit ? t("createProduct.updated") : t("createProduct.created")}
                    </p>
                ) : null}

                <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-extrabold text-[var(--accent-text)] transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
                    disabled={isSaving}
                    type="submit"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                    {isEdit ? t("createProduct.save") : t("createProduct.create")}
                </button>
            </form>
        </main>
    );
}