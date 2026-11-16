import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  CirclePlus,
  Eye,
  EyeOff,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "./api";
import type { Category, Lead, LeadStatus, Product, ProductInput } from "./types";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("ru-BY", { maximumFractionDigits: 0 }).format(price) + " BYN";

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("ru-BY", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));

function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("admin");
  useEffect(() => {
    api.session().then((session) => {
      setUsername(session.username);
      setAuthenticated(true);
    }).catch(() => setAuthenticated(false)).finally(() => setChecking(false));
  }, []);
  async function logout() {
    try { await api.logout(); } finally { setAuthenticated(false); }
  }
  if (checking) return <main className="admin-screen"><div className="admin-checking">Проверяем доступ…</div></main>;
  if (!authenticated) return <LoginPage onLogin={(name) => { setUsername(name); setAuthenticated(true); }} />;
  return <AdminConsole username={username} onLogout={logout} />;
}

function LoginPage({ onLogin }: { onLogin: (username: string) => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    setPending(true);
    setError("");
    try {
      const session = await api.login({
        username: String(data.get("username") || ""),
        password: String(data.get("password") || ""),
      });
      onLogin(session.username);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="admin-screen admin-login-screen">
      <div className="admin-login-top"><Link to="/" className="admin-back"><ArrowLeft size={16} /> Вернуться в магазин</Link><span>Pixel Forge / админка</span></div>
      <section className="login-card">
        <span className="login-emblem"><ShieldCheck size={25} /></span>
        <span className="eyebrow">Управление магазином</span>
        <h1>Вход в админку</h1>
        <p>Управляйте каталогом и заявками Pixel Forge.</p>
        <form className="admin-login-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="admin-username">Логин</label>
            <input id="admin-username" name="username" autoComplete="username" required placeholder="Логин администратора" />
          </div>
          <div className="field">
            <label htmlFor="admin-password">Пароль</label>
            <input id="admin-password" name="password" type="password" autoComplete="current-password" required placeholder="Пароль" />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary button-wide" type="submit" disabled={pending}>{pending ? "Проверяем…" : "Войти"} <ArrowLeft className="login-arrow" size={17} /></button>
        </form>
        <div className="login-security"><ShieldCheck size={15} /><span>Демо-админка · сессия защищена</span></div>
      </section>
      <span className="login-watermark" aria-hidden="true">PF</span>
    </main>
  );
}

function AdminConsole({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [section, setSection] = useState<"products" | "leads">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [toast, setToast] = useState("");
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [nextProducts, nextLeads] = await Promise.all([api.adminProducts(), api.adminLeads()]);
      setProducts(nextProducts);
      setLeads(nextLeads);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru");
    return products.filter((product) => !normalized || [product.name, product.processor, product.graphics].some((part) => part.toLocaleLowerCase("ru").includes(normalized)));
  }, [products, query]);

  function openEditor(product?: Product) {
    setEditingProduct(product);
    setEditorOpen(true);
  }
  function closeEditor() {
    setEditorOpen(false);
    setEditingProduct(undefined);
  }
  async function savedProduct(product: Product) {
    setProducts((current) => {
      const exists = current.some((item) => item.id === product.id);
      return exists ? current.map((item) => item.id === product.id ? product : item) : [product, ...current];
    });
    closeEditor();
    setToast(editingProduct ? "Изменения сохранены" : "Новый товар добавлен");
  }
  async function togglePublished(product: Product) {
    setPendingIds((current) => [...current, product.id]);
    setError("");
    try {
      await api.setPublished(product.id, !product.published);
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, published: !item.published } : item));
      setToast(product.published ? "Товар убран с витрины" : "Товар снова на витрине");
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setPendingIds((current) => current.filter((id) => id !== product.id));
    }
  }
  async function deleteProduct(product: Product) {
    const confirmed = window.confirm("Удалить «" + product.name + "»? Поступившие по нему заявки сохранятся.");
    if (!confirmed) return;
    setPendingIds((current) => [...current, product.id]);
    setError("");
    try {
      await api.deleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setToast("Товар удалён");
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setPendingIds((current) => current.filter((id) => id !== product.id));
    }
  }
  async function changeStatus(lead: Lead, status: LeadStatus) {
    setPendingIds((current) => [...current, lead.id]);
    try {
      await api.setLeadStatus(lead.id, status);
      setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status } : item));
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setPendingIds((current) => current.filter((id) => id !== lead.id));
    }
  }

  return (
    <main className="admin-screen">
      <header className="admin-header">
        <div className="admin-header-left">
          <Link to="/" className="admin-brand"><span className="brand-mark"><Package size={18} /></span><span>Pixel Forge<small>Управление магазином</small></span></Link>
          <span className="admin-divider" />
          <span className="admin-page-label">Панель управления</span>
        </div>
        <div className="admin-header-right">
          <span className="admin-user"><span className="admin-user-dot" />{username}</span>
          <Link className="admin-store-link" to="/">Открыть магазин <ArrowLeft size={14} /></Link>
          <button type="button" className="admin-logout" onClick={onLogout}><LogOut size={16} /><span>Выйти</span></button>
        </div>
      </header>
      <div className="container admin-layout">
        <aside className="admin-sidebar">
          <span className="admin-sidebar-caption">Управление</span>
          <button type="button" className={"admin-side-link" + (section === "products" ? " active" : "")} onClick={() => setSection("products")}><Package size={17} /><span>Товары</span><b>{products.length}</b></button>
          <button type="button" className={"admin-side-link" + (section === "leads" ? " active" : "")} onClick={() => setSection("leads")}><Inbox size={17} /><span>Заявки</span><b>{leads.filter((lead) => lead.status === "new").length || ""}</b></button>
          <div className="admin-sidebar-bottom"><span className="sidebar-status"><span /> База данных активна</span><span>Pixel Forge · демо 1.0</span></div>
        </aside>
        <section className="admin-content">
          <div className="admin-welcome">
            <div><span className="eyebrow">Pixel Forge · панель</span><h1>{section === "products" ? "Каталог товаров" : "Входящие заявки"}</h1><p>{section === "products" ? "Управляйте товарами, ценами и видимостью на витрине." : "Здесь появляются заявки с сайта. Отмечайте, когда связались с клиентом."}</p></div>
            {section === "products" ? <button type="button" className="button button-primary" onClick={() => openEditor()}><CirclePlus size={17} /> Добавить товар</button> : <button type="button" className="button button-admin-outline" onClick={() => void refresh()}>Обновить список</button>}
          </div>
          <div className="admin-stats">
            <div className="admin-stat"><span className="admin-stat-icon"><Package size={17} /></span><span className="admin-stat-label">Всего товаров</span><strong>{products.length}</strong><small>в базе каталога</small></div>
            <div className="admin-stat"><span className="admin-stat-icon"><Eye size={17} /></span><span className="admin-stat-label">На витрине</span><strong>{products.filter((item) => item.published).length}</strong><small>видны покупателям</small></div>
            <div className="admin-stat"><span className="admin-stat-icon"><Inbox size={17} /></span><span className="admin-stat-label">Всего заявок</span><strong>{leads.length}</strong><small>с сайта</small></div>
            <div className="admin-stat"><span className="admin-stat-icon stat-icon-accent"><LayoutDashboard size={17} /></span><span className="admin-stat-label">Новые</span><strong>{leads.filter((lead) => lead.status === "new").length}</strong><small>ждут вашего ответа</small></div>
          </div>
          {error && <div className="admin-error" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="Скрыть сообщение"><X size={15} /></button></div>}
          {section === "products" ? (
            <section className="admin-panel">
              <div className="admin-panel-head">
                <div><span className="eyebrow">Товарная база</span><h2>Все товары <small>{products.length}</small></h2></div>
                <search className="admin-search"><Search size={15} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти товар" aria-label="Найти товар в админке" /></search>
              </div>
              {loading ? <div className="admin-loading">Загружаем каталог…</div> : (
                <div className="admin-table-wrap">
                  <table className="admin-table products-table">
                    <caption className="visually-hidden">Список товаров каталога Pixel Forge</caption>
                    <thead><tr><th scope="col">Товар</th><th scope="col">Цена</th><th scope="col">Витрина</th><th scope="col">Действия</th></tr></thead>
                    <tbody>
                      {filteredProducts.map((product) => <tr key={product.id}>
                        <th scope="row"><div className="admin-product-cell"><ProductThumb product={product} /><span><strong>{product.name}</strong><small>{product.category === "pc" ? "Игровой компьютер" : "Игровой ноутбук"}</small></span></div></th>
                        <td data-label="Цена"><span className="mobile-cell-label" aria-hidden="true">Цена</span><strong className="admin-price">{formatPrice(product.price)}</strong></td>
                        <td data-label="Витрина"><span className="mobile-cell-label" aria-hidden="true">Витрина</span><span className={"visibility-pill " + (product.published ? "is-published" : "is-hidden")}><i />{product.published ? "На витрине" : "Скрыт"}</span></td>
                        <td data-label="Действия"><span className="mobile-cell-label" aria-hidden="true">Действия</span><div className="row-actions">
                          <button className="row-action" type="button" aria-label={"Редактировать " + product.name} title="Редактировать" onClick={() => openEditor(product)} disabled={pendingIds.includes(product.id)}><Pencil size={15} /></button>
                          <button className="row-action" type="button" aria-label={product.published ? "Убрать с витрины " + product.name : "Показать на витрине " + product.name} title={product.published ? "Убрать с витрины" : "Выставить на витрину"} onClick={() => void togglePublished(product)} disabled={pendingIds.includes(product.id)}>{product.published ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                          <button className="row-action row-action-danger" type="button" aria-label={"Удалить " + product.name} title="Удалить" onClick={() => void deleteProduct(product)} disabled={pendingIds.includes(product.id)}><Trash2 size={15} /></button>
                        </div></td>
                      </tr>)}
                      {!filteredProducts.length && <tr><td className="admin-table-empty" colSpan={4}>{query ? "По вашему запросу товары не найдены." : "Товаров пока нет. Добавьте первый товар."}</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="admin-panel-foot"><span>Показывается {filteredProducts.length} из {products.length} товаров</span><span>Последнее обновление · только что</span></div>
            </section>
          ) : (
            <section className="admin-panel">
              <div className="admin-panel-head">
                <div><span className="eyebrow">Клиентские обращения</span><h2>Все заявки <small>{leads.length}</small></h2></div>
                <span className="lead-heading-note"><span className="availability-dot" /> Новые отображаются первыми</span>
              </div>
              {loading ? <div className="admin-loading">Загружаем заявки…</div> : (
                <div className="admin-table-wrap">
                  <table className="admin-table leads-table">
                    <caption className="visually-hidden">Заявки покупателей Pixel Forge</caption>
                    <thead><tr><th scope="col">Клиент</th><th scope="col">Товар</th><th scope="col">Дата</th><th scope="col">Статус</th></tr></thead>
                    <tbody>
                      {leads.map((lead) => <tr key={lead.id}>
                        <th scope="row"><div className="lead-person"><span className="lead-avatar">{lead.name.trim().charAt(0).toLocaleUpperCase("ru")}</span><span><strong>{lead.name}</strong><a href={"tel:" + lead.phone.replace(/[^\d+]/g, "")}>{lead.phone}</a></span></div></th>
                        <td data-label="Товар"><span className="mobile-cell-label" aria-hidden="true">Товар</span><span className="lead-product-name">{lead.productName}</span></td>
                        <td data-label="Дата"><span className="mobile-cell-label" aria-hidden="true">Дата</span><span className="lead-date">{formatDate(lead.createdAt)}</span></td>
                        <td data-label="Статус"><span className="mobile-cell-label" aria-hidden="true">Статус</span><select className={"lead-status status-" + lead.status} value={lead.status} onChange={(event) => void changeStatus(lead, event.target.value as LeadStatus)} disabled={pendingIds.includes(lead.id)} aria-label={"Статус заявки " + lead.name}><option value="new">Новая</option><option value="contacted">Связались</option><option value="closed">Закрыта</option></select></td>
                      </tr>)}
                      {!leads.length && <tr><td className="admin-table-empty" colSpan={4}><div className="admin-empty-icon"><Inbox size={23} /></div>Пока нет заявок. Они появятся здесь после отправки формы на сайте.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="admin-panel-foot"><span>Все заявки остаются в истории, даже если товар убран с витрины.</span><span>Личные данные доступны только администратору</span></div>
            </section>
          )}
        </section>
      </div>
      <ProductEditor open={editorOpen} product={editingProduct} onClose={closeEditor} onSaved={savedProduct} />
      {toast && <div className="admin-toast" role="status"><Check size={17} />{toast}</div>}
    </main>
  );
}

function ProductThumb({ product }: { product: Product }) {
  return <span className="admin-product-thumb"><img src={product.imageUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /></span>;
}

function ProductEditor({ open, product, onClose, onSaved }: {
  open: boolean;
  product?: Product;
  onClose: () => void;
  onSaved: (product: Product) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<ProductInput>(newProduct());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setDraft(product ? {
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
      processor: product.processor,
      graphics: product.graphics,
      memory: product.memory,
      storage: product.storage,
      imageUrl: product.imageUrl,
      published: product.published,
      featured: product.featured,
    } : newProduct());
    setError("");
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [open, product]);
  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setPending(true);
    setError("");
    try {
      const saved = await api.saveProduct(draft, product?.id);
      onSaved(saved);
      dialogRef.current?.close();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <dialog className="admin-editor-dialog" ref={dialogRef} aria-labelledby="editor-title" onClose={onClose}>
      <div className="dialog-topline"><span>{product ? "РЕДАКТИРОВАНИЕ" : "НОВАЯ ПОЗИЦИЯ"}</span><button className="icon-button" type="button" aria-label="Закрыть окно" onClick={() => dialogRef.current?.close()}><X size={19} /></button></div>
      <h2 id="editor-title">{product ? "Изменить товар" : "Добавить товар"}<span className="title-period">.</span></h2>
      <p className="editor-intro">Поля со звёздочкой обязательны. Цены указываются в BYN.</p>
      <form className="editor-form" onSubmit={submit}>
        <div className="editor-grid">
          <div className="field"><label htmlFor="product-name">Название <span aria-hidden="true">*</span></label><input id="product-name" value={draft.name} onChange={(event) => update("name", event.target.value)} maxLength={100} required placeholder="Например, Aurora R5" /></div>
          <div className="field"><label htmlFor="product-category">Категория <span aria-hidden="true">*</span></label><select id="product-category" value={draft.category} onChange={(event) => update("category", event.target.value as Category)}><option value="pc">Игровой компьютер</option><option value="laptop">Игровой ноутбук</option></select></div>
          <div className="field"><label htmlFor="product-price">Цена, BYN <span aria-hidden="true">*</span></label><input id="product-price" type="number" min="1" max="1000000" step="1" value={draft.price} onChange={(event) => update("price", Number(event.target.value))} required /></div>
          <div className="field"><label htmlFor="product-image">Ссылка на изображение <span aria-hidden="true">*</span></label><input id="product-image" type="url" value={draft.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} required placeholder="https://..." /></div>
          <div className="field editor-full"><label htmlFor="product-description">Описание <span aria-hidden="true">*</span></label><textarea id="product-description" rows={3} maxLength={700} value={draft.description} onChange={(event) => update("description", event.target.value)} required placeholder="Кратко опишите конфигурацию" /></div>
          <div className="field"><label htmlFor="product-processor">Процессор <span aria-hidden="true">*</span></label><input id="product-processor" value={draft.processor} onChange={(event) => update("processor", event.target.value)} required placeholder="AMD Ryzen 5 7600" /></div>
          <div className="field"><label htmlFor="product-graphics">Видеокарта <span aria-hidden="true">*</span></label><input id="product-graphics" value={draft.graphics} onChange={(event) => update("graphics", event.target.value)} required placeholder="GeForce RTX 4060 8 ГБ" /></div>
          <div className="field"><label htmlFor="product-memory">Оперативная память <span aria-hidden="true">*</span></label><input id="product-memory" value={draft.memory} onChange={(event) => update("memory", event.target.value)} required placeholder="32 ГБ DDR5" /></div>
          <div className="field"><label htmlFor="product-storage">Накопитель <span aria-hidden="true">*</span></label><input id="product-storage" value={draft.storage} onChange={(event) => update("storage", event.target.value)} required placeholder="SSD NVMe 1 ТБ" /></div>
        </div>
        <div className="editor-toggles">
          <label className="toggle-row"><input type="checkbox" checked={draft.published} onChange={(event) => update("published", event.target.checked)} /><span className="toggle-ui" /><span><strong>Показывать на витрине</strong><small>Товар будет доступен посетителям магазина.</small></span></label>
          <label className="toggle-row"><input type="checkbox" checked={draft.featured} onChange={(event) => update("featured", event.target.checked)} /><span className="toggle-ui" /><span><strong>Популярный товар</strong><small>Показывать в подборке на главной.</small></span></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="editor-actions">
          <button className="button button-admin-outline" type="button" onClick={() => dialogRef.current?.close()}>Отмена</button>
          <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Сохраняем…" : product ? "Сохранить изменения" : "Добавить товар"} <Check size={16} /></button>
        </div>
      </form>
    </dialog>
  );
}

function newProduct(): ProductInput {
  return {
    name: "",
    category: "pc",
    price: 2990,
    description: "",
    processor: "",
    graphics: "",
    memory: "",
    storage: "",
    imageUrl: "",
    published: true,
    featured: false,
  };
}

export default AdminPage;
