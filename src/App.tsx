import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Gamepad2,
  HardDrive,
  Laptop,
  Menu,
  Monitor,
  PackageCheck,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { Link, NavLink, Route, Routes, useLocation, useParams } from "react-router-dom";
import { api } from "./api";
import type { Category, Product } from "./types";
import AdminPage from "./Admin";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("ru-BY", { maximumFractionDigits: 0 }).format(price) + " BYN";

function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api.products()
      .then((items) => { if (active) setProducts(items); })
      .catch((reason: Error) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { products, loading, error };
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={"brand" + (compact ? " brand-compact" : "")} to="/" aria-label="Pixel Forge — на главную">
      <span className="brand-mark" aria-hidden="true"><b>P</b><i>F</i></span>
      {!compact && <span className="brand-copy"><strong>Pixel Forge</strong><small>Игровые компьютеры и ноутбуки</small></span>}
    </Link>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav id="site-navigation" className={"main-nav" + (menuOpen ? " is-open" : "")} aria-label="Основная навигация">
          <NavLink to="/catalog?category=pc" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Компьютеры</NavLink>
          <NavLink to="/catalog?category=laptop" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Ноутбуки</NavLink>
          <a className="nav-link" href="/#advantages" onClick={() => setMenuOpen(false)}>О магазине</a>
          <Link className="mobile-nav-cta" to="/catalog">Открыть каталог <ArrowRight size={16} /></Link>
        </nav>
        <Link className="button button-outline header-cta" to="/catalog">Каталог <ArrowRight size={16} /></Link>
        <button
          className="icon-button menu-toggle"
          type="button"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer" id="contacts">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand-block">
            <Brand />
            <p>Демонстрационный каталог игровых компьютеров и ноутбуков.</p>
          </div>
          <div className="footer-column">
            <span className="footer-label">Магазин</span>
            <Link to="/catalog">Все товары</Link>
            <Link to="/catalog?category=pc">Игровые компьютеры</Link>
            <Link to="/catalog?category=laptop">Ноутбуки</Link>
          </div>
          <div className="footer-column">
            <span className="footer-label">Связаться</span>
            <a href="tel:+375290000000">+375 (29) 000-00-00</a>
            <span>Пн–Сб, 10:00–20:00</span>
            <span>Минск, демонстрационный адрес</span>
          </div>
          <div className="footer-contact">
            <span className="footer-label">Нужна помощь с выбором?</span>
            <p>Расскажем о конфигурациях и поможем подобрать подходящую.</p>
            <a className="text-link" href="tel:+375290000000">Позвонить нам <ArrowRight size={15} /></a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Pixel Forge · Демо-проект</span>
          <span>Цены и наличие приведены для демонстрации</span>
          <Link to="/admin" className="footer-admin-link">Админка</Link>
        </div>
      </div>
    </footer>
  );
}

function ProductImage({ product, className = "", eager = false }: { product: Product; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={"product-image " + className + (failed ? " image-failed" : "")}>
      {!failed ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="image-placeholder" aria-hidden="true">
          {product.category === "pc" ? <Monitor size={54} /> : <Laptop size={54} />}
          <span>Pixel Forge</span>
        </div>
      )}
      <span className="image-corner-mark" aria-hidden="true"><Cpu size={15} /></span>
    </div>
  );
}

function ProductCard({ product, onLead }: { product: Product; onLead: (product: Product) => void }) {
  const Icon = product.category === "pc" ? Monitor : Laptop;
  return (
    <article className="product-card">
      <Link to={"/catalog/" + product.id} className="product-card-image-link" aria-label={"Подробнее о товаре " + product.name}>
        <ProductImage product={product} />
        <span className="product-category"><Icon size={13} /> {product.category === "pc" ? "Игровой ПК" : "Ноутбук"}</span>
      </Link>
      <div className="product-card-body">
        <Link to={"/catalog/" + product.id} className="product-name">{product.name}<ArrowUpRight size={16} /></Link>
        <div className="product-specs">
          <span><Cpu size={14} /> {product.processor}</span>
          <span><Gamepad2 size={14} /> {product.graphics}</span>
          <span><HardDrive size={14} /> {product.memory} · {product.storage}</span>
        </div>
        <div className="product-card-bottom">
          <div className="price-block">
            <strong>{formatPrice(product.price)}</strong>
            <span>Демонстрационная цена</span>
          </div>
          <button className="button product-lead-button" type="button" onClick={() => onLead(product)} aria-label={"Оставить заявку на " + product.name}>
            <span>Оставить заявку</span><ArrowRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductGrid({ products, onLead, loading }: { products: Product[]; onLead: (product: Product) => void; loading?: boolean }) {
  if (loading) {
    return <div className="product-grid" aria-label="Загрузка товаров">{[0, 1, 2, 3].map((item) => <div className="product-skeleton" key={item} />)}</div>;
  }
  if (!products.length) {
    return <div className="empty-state"><Search size={24} /><strong>Ничего не нашлось</strong><span>Попробуйте изменить фильтры или поисковый запрос.</span></div>;
  }
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} onLead={onLead} />)}</div>;
}

function ApplicationDialog({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (!product) return;
    setError("");
    setSuccess("");
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const timer = window.setTimeout(() => nameRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [product]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    setPending(true);
    setError("");
    try {
      const result = await api.sendLead({
        name: String(data.get("name") || ""),
        phone: String(data.get("phone") || ""),
        productId: product.id,
      });
      setSuccess(result.message);
      form.reset();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setPending(false);
    }
  }
  if (!product) return null;
  return (
    <dialog className="request-dialog" ref={dialogRef} aria-labelledby="request-title" onClose={onClose}>
      <div className="dialog-topline"><span>Оставить заявку</span><button className="icon-button" type="button" aria-label="Закрыть форму" onClick={() => dialogRef.current?.close()}><X size={20} /></button></div>
      {success ? (
        <div className="request-success">
          <span className="success-mark"><CheckCircle2 size={30} /></span>
          <h2 id="request-title">Заявка принята</h2>
          <p>{success}</p>
          <button className="button button-primary button-wide" type="button" onClick={() => dialogRef.current?.close()}>Хорошо <Check size={16} /></button>
        </div>
      ) : (
        <>
          <span className="eyebrow">Pixel Forge · консультация</span>
          <h2 id="request-title">Обсудим вашу сборку</h2>
          <p className="dialog-description">Оставьте контакты — поможем с выбором и ответим на вопросы.</p>
          <div className="dialog-product"><ProductImage product={product} /><div><span>Вы выбрали</span><strong>{product.name}</strong><b>{formatPrice(product.price)}</b></div></div>
          <form className="request-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="lead-name">Ваше имя <span aria-hidden="true">*</span></label>
              <input ref={nameRef} id="lead-name" name="name" type="text" autoComplete="name" minLength={2} maxLength={100} required placeholder="Например, Алексей" />
            </div>
            <div className="field">
              <label htmlFor="lead-phone">Номер телефона <span aria-hidden="true">*</span></label>
              <input id="lead-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" pattern="[+0-9() -]{9,22}" maxLength={22} required placeholder="+375 (__) ___-__-__" aria-describedby="phone-hint" />
              <span className="field-hint" id="phone-hint">Позвоним, чтобы обсудить детали заявки.</span>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary button-wide" type="submit" disabled={pending}>
              {pending ? "Отправляем…" : "Отправить заявку"} <ArrowRight size={17} />
            </button>
            <p className="form-note">Нажимая кнопку, вы отправляете демо-заявку на консультацию.</p>
          </form>
        </>
      )}
    </dialog>
  );
}

function HomePage({ onLead }: { onLead: (product: Product) => void }) {
  const { products, loading, error } = useProducts();
  const popular = products.filter((item) => item.featured).slice(0, 4);
  return (
    <>
      <main>
        <section className="container hero-section" aria-labelledby="hero-title">
          <div className="hero-visual">
            <img
              src="/images/pixel-forge-pc-and-laptop.webp"
              alt="Игровой компьютер и ноутбук для демонстрационной витрины"
              width={1536}
              height={1024}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow">Pixel Forge / магазин игровой техники</span>
            <h1 id="hero-title">Техника для игр<span>.</span></h1>
            <p>Игровые компьютеры и ноутбуки Pixel Forge</p>
            <div className="hero-actions">
              <a className="button button-primary button-large" href="#categories">Выбрать формат <ArrowRight size={17} /></a>
            </div>
          </div>
        </section>

        <section className="container category-strip" id="categories" aria-labelledby="category-heading">
          <div className="category-section-heading">
            <div><span className="eyebrow">Каталог Pixel Forge</span><h2 id="category-heading">Выбери формат</h2></div>
            <p>Стационарный компьютер или игровой ноутбук — два способа собрать своё игровое место.</p>
          </div>
          <div className="category-grid">
            <Link className="category-card category-card-pc" to="/catalog?category=pc" aria-label="Смотреть игровые компьютеры">
              <img className="category-photo category-photo-pc" src="/images/pixel-forge-pc-and-laptop.webp" alt="" loading="lazy" decoding="async" width={1536} height={1024} />
              <span className="category-index">01 / Стационарные системы</span>
              <strong className="category-title">Игровые компьютеры</strong>
              <span className="category-open" aria-hidden="true"><ArrowRight size={18} /></span>
            </Link>
            <Link className="category-card category-card-laptop" to="/catalog?category=laptop" aria-label="Смотреть игровые ноутбуки">
              <img className="category-photo category-photo-laptop" src="/images/pixel-forge-pc-and-laptop.webp" alt="" loading="lazy" decoding="async" width={1536} height={1024} />
              <span className="category-index">02 / Портативные системы</span>
              <strong className="category-title">Ноутбуки</strong>
              <span className="category-open" aria-hidden="true"><ArrowRight size={18} /></span>
            </Link>
          </div>
        </section>

        <section className="section container" id="popular">
          <div className="section-heading">
            <div><span className="eyebrow">Каталог Pixel Forge</span><h2>Популярные модели</h2></div>
            <div className="section-heading-aside"><p>Характеристики и демонстрационные цены — в белорусских рублях.</p><Link className="text-link" to="/catalog">Все товары <ArrowRight size={16} /></Link></div>
          </div>
          {error ? <div className="inline-error" role="status">{error}</div> : <ProductGrid products={popular} onLead={onLead} loading={loading} />}
        </section>

        <section className="approach-section" id="advantages">
          <div className="container approach-inner">
            <div className="approach-visual">
              <div className="approach-visual-head"><span>В карточке модели</span><span className="approach-live-dot" /> Демо-данные</div>
              <div className="approach-visual-list">
                <div><strong>Процессор</strong><i>AMD Ryzen · Intel Core</i></div>
                <div><strong>Видеокарта</strong><i>GeForce RTX</i></div>
                <div><strong>Оперативная память</strong><i>DDR5</i></div>
                <div><strong>Накопитель</strong><i>SSD NVMe</i></div>
              </div>
              <div className="approach-visual-foot"><Cpu size={16} /> Все четыре ключевых параметра</div>
            </div>
            <div className="approach-copy">
              <span className="eyebrow">О магазине</span>
              <h2>Выбирайте по<br /><span>характеристикам</span></h2>
              <p>Для каждой демо-модели указаны процессор, видеокарта, память и накопитель. Сравните конфигурации, затем оставьте заявку по подходящему товару.</p>
              <div className="approach-points">
                <div><span className="point-icon"><Cpu size={18} /></span><div><strong>Параметры в каждой карточке</strong><small>Процессор, графика, память и SSD.</small></div></div>
                <div><span className="point-icon"><PackageCheck size={18} /></span><div><strong>Компьютеры и ноутбуки</strong><small>Две категории в одном каталоге.</small></div></div>
                <div><span className="point-icon"><ShieldCheck size={18} /></span><div><strong>Цены указаны в BYN</strong><small>Все товары и цены демонстрационные.</small></div></div>
              </div>
              <Link className="button button-outline" to="/catalog">Перейти в каталог <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>

        <section className="container final-cta">
          <div><span className="eyebrow">Pixel Forge</span><h2>Есть вопросы <span>по выбору?</span></h2><p>Откройте каталог и отправьте заявку по модели.</p></div>
          <Link className="button button-primary button-large" to="/catalog">Открыть каталог <ArrowRight size={17} /></Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

function CatalogPage({ onLead }: { onLead: (product: Product) => void }) {
  const { products, loading, error } = useProducts();
  const location = useLocation();
  const initial = new URLSearchParams(location.search).get("category");
  const [category, setCategory] = useState<"all" | Category>(initial === "pc" || initial === "laptop" ? initial : "all");
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    const value = new URLSearchParams(location.search).get("category");
    setCategory(value === "pc" || value === "laptop" ? value : "all");
  }, [location.search]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru");
    const result = products.filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      const matchesQuery = !normalized || [product.name, product.processor, product.graphics, product.category === "pc" ? "компьютер" : "ноутбук"]
        .some((value) => value.toLocaleLowerCase("ru").includes(normalized));
      const matchesMin = !minPrice || product.price >= Number(minPrice);
      const matchesMax = !maxPrice || product.price <= Number(maxPrice);
      return matchesCategory && matchesQuery && matchesMin && matchesMax;
    });
    return result.sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : Number(b.featured) - Number(a.featured));
  }, [products, category, query, minPrice, maxPrice, sort]);
  return (
    <>
      <main className="container catalog-page">
        <div className="breadcrumbs"><Link to="/">Главная</Link><span>/</span><span>Каталог</span></div>
        <div className="catalog-title-row">
          <div><span className="eyebrow">Подбор по характеристикам</span><h1>Каталог</h1><p>Демо-модели игровых ПК и ноутбуков. Цены указаны в BYN.</p></div>
          <div className="catalog-count"><strong>{filtered.length}</strong><span>моделей<br />в подборке</span></div>
        </div>
        <div className="catalog-layout">
          <aside className={"catalog-filters" + (filtersOpen ? " filters-open" : "")}>
            <div className="filter-title"><span><SlidersHorizontal size={17} /> Фильтры</span><button className="icon-button filters-close" onClick={() => setFiltersOpen(false)} type="button" aria-label="Закрыть фильтры"><X size={18} /></button></div>
            <fieldset className="filter-group">
              <legend>Тип устройства</legend>
              <label className="radio-row"><input type="radio" name="category" checked={category === "all"} onChange={() => setCategory("all")} /><span>Все устройства</span><small>{products.length}</small></label>
              <label className="radio-row"><input type="radio" name="category" checked={category === "pc"} onChange={() => setCategory("pc")} /><span>Компьютеры</span><small>{products.filter((item) => item.category === "pc").length}</small></label>
              <label className="radio-row"><input type="radio" name="category" checked={category === "laptop"} onChange={() => setCategory("laptop")} /><span>Ноутбуки</span><small>{products.filter((item) => item.category === "laptop").length}</small></label>
            </fieldset>
            <fieldset className="filter-group">
              <legend>Цена, BYN</legend>
              <div className="price-range">
                <label><span>От</span><input type="number" min="0" step="100" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} aria-label="Минимальная цена в BYN" placeholder="0" /></label>
                <span className="range-divider">—</span>
                <label><span>До</span><input type="number" min="0" step="100" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} aria-label="Максимальная цена в BYN" placeholder="10 000" /></label>
              </div>
            </fieldset>
            <div className="filter-help"><span><Zap size={17} /></span><p>Не знаете, с чего начать?</p><Link to="/#contacts">Спросите нас <ArrowRight size={14} /></Link></div>
          </aside>
          {filtersOpen && <button className="filter-scrim" type="button" aria-label="Закрыть фильтры" onClick={() => setFiltersOpen(false)} />}
          <section className="catalog-results" aria-label="Результаты каталога">
            <div className="catalog-toolbar">
              <search className="catalog-search"><Search size={17} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по названию или характеристикам" aria-label="Поиск товаров" /></search>
              <button className="mobile-filter-button" type="button" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} /> Фильтры</button>
              <label className="sort-label">Сортировка <span className="select-wrap"><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Сортировать каталог"><option value="featured">Популярные</option><option value="price-low">Сначала дешевле</option><option value="price-high">Сначала дороже</option></select><ChevronDown size={15} /></span></label>
            </div>
            {error ? <div className="inline-error" role="status">{error}</div> : <ProductGrid products={filtered} onLead={onLead} loading={loading} />}
            {!loading && !error && filtered.length > 0 && <p className="catalog-footnote">Все товары и цены на этой странице демонстрационные.</p>}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ProductPage({ onLead }: { onLead: (product: Product) => void }) {
  const { id = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    api.product(id).then((item) => { if (active) setProduct(item); })
      .catch((reason: Error) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  if (loading) return <main className="container product-detail-page"><div className="loading-line">Загружаем товар…</div></main>;
  if (!product) return <main className="container product-detail-page"><div className="breadcrumbs"><Link to="/">Главная</Link><span>/</span><Link to="/catalog">Каталог</Link></div><div className="product-not-found"><span className="eyebrow">Товар убран с витрины</span><h1>Товар не найден</h1><p>{error || "Возможно, его уже убрали из каталога."}</p><Link className="button button-primary" to="/catalog"><ArrowLeft size={16} /> Вернуться в каталог</Link></div></main>;
  const Icon = product.category === "pc" ? Monitor : Laptop;
  const specs = [
    ["Процессор", product.processor, <Cpu size={17} />],
    ["Видеокарта", product.graphics, <Gamepad2 size={17} />],
    ["Оперативная память", product.memory, <Sparkles size={17} />],
    ["Накопитель", product.storage, <HardDrive size={17} />],
  ] as const;
  return (
    <>
      <main className="container product-detail-page">
        <div className="breadcrumbs"><Link to="/">Главная</Link><span>/</span><Link to="/catalog">Каталог</Link><span>/</span><span>{product.name}</span></div>
        <div className="product-detail">
          <div className="detail-image-panel"><ProductImage product={product} eager /><span className="detail-photo-note">Демо-конфигурация Pixel Forge</span></div>
          <div className="detail-copy">
            <span className="product-category detail-category"><Icon size={14} /> {product.category === "pc" ? "Игровой компьютер" : "Игровой ноутбук"}</span>
            <span className="eyebrow">Демо-конфигурация</span>
            <h1>{product.name}<span className="title-period">.</span></h1>
            <p className="detail-description">{product.description}</p>
            <div className="detail-price"><strong>{formatPrice(product.price)}</strong><span>Демонстрационная цена</span></div>
            <div className="detail-specs-list">
              {specs.map(([label, value, icon]) => <div className="detail-spec-row" key={label}><span className="detail-spec-icon">{icon}</span><span>{label}</span><strong>{value}</strong></div>)}
            </div>
            <div className="detail-availability"><span className="availability-dot" /> Доступен для заявки</div>
            <button className="button button-primary button-large button-wide" type="button" onClick={() => onLead(product)}>Оставить заявку <ArrowRight size={17} /></button>
            <p className="detail-note">Это демо-каталог. Заявка отправляется администратору для демонстрации.</p>
          </div>
        </div>
        <Link className="back-link" to="/catalog"><ArrowLeft size={15} /> Назад к каталогу</Link>
      </main>
      <Footer />
    </>
  );
}

function App() {
  const [requestedProduct, setRequestedProduct] = useState<Product | null>(null);
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) {
      document.title = "Админка | Pixel Forge";
    } else if (location.pathname.startsWith("/catalog/")) {
      document.title = "Товар | Pixel Forge";
    } else if (location.pathname === "/catalog") {
      document.title = "Каталог | Pixel Forge";
    } else {
      document.title = "Pixel Forge — игровые компьютеры и ноутбуки";
    }
  }, [location.pathname]);
  const openRequest = (product: Product) => setRequestedProduct(product);
  return (
    <>
      {!location.pathname.startsWith("/admin") && <Header />}
      <Routes>
        <Route path="/" element={<HomePage onLead={openRequest} />} />
        <Route path="/catalog" element={<CatalogPage onLead={openRequest} />} />
        <Route path="/catalog/:id" element={<ProductPage onLead={openRequest} />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="*" element={<main className="container product-not-found"><h1>Страница не найдена.</h1><Link className="button button-primary" to="/">На главную</Link></main>} />
      </Routes>
      <ApplicationDialog product={requestedProduct} onClose={() => setRequestedProduct(null)} />
    </>
  );
}

export default App;
