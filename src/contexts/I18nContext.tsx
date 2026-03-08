import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Lang = "en" | "ru";

const translations = {
  // Header
  "header.search_placeholder": {
    en: "Search by part number, keyword, or manufacturer...",
    ru: "Поиск по номеру детали, ключевому слову или производителю...",
  },
  "header.search": { en: "Search", ru: "Поиск" },
  "header.request_quote": { en: "Request Quote", ru: "Запрос цены" },
  "header.bom_upload": { en: "BOM Upload", ru: "Загрузить BOM" },
  "header.products": { en: "Products", ru: "Продукция" },
  "header.manufacturers": { en: "Manufacturers", ru: "Производители" },
  "header.full_catalog": { en: "Full Catalog", ru: "Полный каталог" },
  "header.new_products": { en: "New Products", ru: "Новинки" },
  "header.resources": { en: "Resources", ru: "Ресурсы" },
  "header.contact": { en: "Contact", ru: "Контакты" },

  // Hero
  "hero.title_1": { en: "Electronic Components", ru: "Электронные компоненты" },
  "hero.title_2": { en: "for Engineers", ru: "для инженеров" },
  "hero.subtitle": {
    en: "Over 1,000,000 components in stock. Parametric search, datasheets, competitive pricing. Trusted by R&D teams and OEMs worldwide.",
    ru: "Более 1 000 000 компонентов на складе. Параметрический поиск, даташиты, конкурентные цены. Доверяют команды R&D и OEM по всему миру.",
  },
  "hero.search_placeholder": {
    en: "Search part number, keyword, manufacturer...",
    ru: "Номер детали, ключевое слово, производитель...",
  },

  // Stats
  "stats.parts": { en: "1M+ Parts", ru: "1М+ деталей" },
  "stats.in_stock": { en: "In Stock", ru: "На складе" },
  "stats.same_day": { en: "Same Day", ru: "В тот же день" },
  "stats.shipping": { en: "Shipping", ru: "Доставка" },
  "stats.expert": { en: "Expert", ru: "Экспертная" },
  "stats.support": { en: "Support", ru: "Поддержка" },

  // Index sections
  "index.browse_category": { en: "Browse by Category", ru: "Категории" },
  "index.featured": { en: "Featured Components", ru: "Рекомендуемые компоненты" },
  "index.view_all": { en: "View All", ru: "Все товары" },
  "index.auth_manufacturers": { en: "Authorized Manufacturers", ru: "Авторизованные производители" },
  "index.parts": { en: "parts", ru: "компонентов" },
  "index.in_stock": { en: "in stock", ru: "на складе" },
  "index.lead_time": { en: "Lead time", ru: "Под заказ" },

  // Catalog
  "catalog.title": { en: "Product Catalog", ru: "Каталог продукции" },
  "catalog.results_for": { en: "Results for", ru: "Результаты для" },
  "catalog.products_found": { en: "products found", ru: "товаров найдено" },
  "catalog.filters": { en: "Filters", ru: "Фильтры" },
  "catalog.export": { en: "Export", ru: "Экспорт" },
  "catalog.part_number": { en: "Part Number", ru: "Номер детали" },
  "catalog.manufacturer": { en: "Manufacturer", ru: "Производитель" },
  "catalog.description": { en: "Description", ru: "Описание" },
  "catalog.package": { en: "Package", ru: "Корпус" },
  "catalog.stock": { en: "Stock", ru: "Наличие" },
  "catalog.price": { en: "Price", ru: "Цена" },
  "catalog.no_products": {
    en: "No products found. Try adjusting your search or filters.",
    ru: "Товары не найдены. Попробуйте изменить поиск или фильтры.",
  },
  "catalog.clear_filters": { en: "Clear all filters", ru: "Сбросить все фильтры" },
  "catalog.rohs": { en: "RoHS", ru: "RoHS" },
  "catalog.availability": { en: "Availability", ru: "Наличие" },
  "catalog.in_stock": { en: "In Stock", ru: "В наличии" },
  "catalog.contact": { en: "Contact", ru: "По запросу" },
  "catalog.home": { en: "Home", ru: "Главная" },

  // Product Detail
  "product.back": { en: "Back to results", ru: "Назад к результатам" },
  "product.tech_specs": { en: "Technical Specifications", ru: "Технические характеристики" },
  "product.cross_refs": { en: "Cross References", ru: "Аналоги" },
  "product.availability": { en: "Availability", ru: "Наличие" },
  "product.price_tiers": { en: "PRICE TIERS", ru: "ЦЕНОВЫЕ УРОВНИ" },
  "product.qty": { en: "Qty", ru: "Кол-во" },
  "product.unit_price": { en: "Unit Price", ru: "Цена за шт." },
  "product.add_to_cart": { en: "Add to Cart", ru: "В корзину" },
  "product.request_quote": { en: "Request Quote", ru: "Запрос цены" },
  "product.datasheet": { en: "Datasheet", ru: "Даташит" },
  "product.save": { en: "Save", ru: "Сохранить" },
  "product.compare": { en: "Compare", ru: "Сравнить" },
  "product.in_compare": { en: "In Compare", ru: "В сравнении" },
  "product.share": { en: "Share", ru: "Поделиться" },
  "product.related": { en: "Related Products", ru: "Похожие товары" },
  "product.not_found": { en: "Product Not Found", ru: "Товар не найден" },
  "product.back_catalog": { en: "← Back to Catalog", ru: "← Назад в каталог" },

  // Spec labels
  "spec.part_number": { en: "Part Number", ru: "Номер детали" },
  "spec.manufacturer": { en: "Manufacturer", ru: "Производитель" },
  "spec.category": { en: "Category", ru: "Категория" },
  "spec.frequency": { en: "Frequency Range", ru: "Диапазон частот" },
  "spec.gain": { en: "Gain", ru: "Коэффициент усиления" },
  "spec.noise_figure": { en: "Noise Figure", ru: "Коэффициент шума" },
  "spec.output_power": { en: "Output Power", ru: "Выходная мощность" },
  "spec.supply_voltage": { en: "Supply Voltage", ru: "Напряжение питания" },
  "spec.package": { en: "Package", ru: "Корпус" },
  "spec.temp_range": { en: "Temperature Range", ru: "Диапазон температур" },
  "spec.rohs": { en: "RoHS Compliant", ru: "Соответствие RoHS" },
  "spec.moq": { en: "MOQ", ru: "МОЗ" },
  "spec.lead_time": { en: "Lead Time", ru: "Срок поставки" },
  "spec.stock": { en: "Stock", ru: "Наличие" },
  "spec.price_qty1": { en: "Price (qty 1)", ru: "Цена (от 1 шт.)" },
  "spec.description": { en: "Description", ru: "Описание" },
  "spec.yes": { en: "Yes", ru: "Да" },
  "spec.no": { en: "No", ru: "Нет" },

  // Compare
  "compare.title": { en: "Component Comparison", ru: "Сравнение компонентов" },
  "compare.empty_title": { en: "No components to compare", ru: "Нет компонентов для сравнения" },
  "compare.empty_text": {
    en: "Add components from the catalog using the compare checkbox.",
    ru: "Добавьте компоненты из каталога, используя флажок сравнения.",
  },
  "compare.catalog": { en: "catalog", ru: "каталога" },
  "compare.specification": { en: "Specification", ru: "Характеристика" },
  "compare.clear": { en: "Clear all", ru: "Очистить всё" },
  "compare.back_catalog": { en: "Back to catalog", ru: "Назад в каталог" },
  "compare.bar_compare": { en: "Compare", ru: "Сравнение" },
  "compare.bar_clear": { en: "Clear", ru: "Очистить" },
  "compare.bar_now": { en: "Compare Now", ru: "Сравнить" },
  "compare.breadcrumb": { en: "Compare Components", ru: "Сравнение компонентов" },

  // Footer
  "footer.desc": {
    en: "Your trusted partner for electronic components. Over 1,000,000 parts in stock from leading manufacturers.",
    ru: "Ваш надёжный партнёр по электронным компонентам. Более 1 000 000 деталей от ведущих производителей.",
  },
  "footer.products": { en: "Products", ru: "Продукция" },
  "footer.services": { en: "Services", ru: "Услуги" },
  "footer.contact": { en: "Contact", ru: "Контакты" },
  "footer.request_quote": { en: "Request Quote", ru: "Запрос цены" },
  "footer.bom_upload": { en: "BOM Upload", ru: "Загрузить BOM" },
  "footer.tech_resources": { en: "Technical Resources", ru: "Техническая документация" },
  "footer.contact_sales": { en: "Contact Sales", ru: "Связаться с отделом продаж" },
  "footer.rights": {
    en: "© 2026 SibMicro. All rights reserved. | ISO 9001 Certified | ITAR Registered",
    ru: "© 2026 SibMicro. Все права защищены. | Сертификат ISO 9001 | Регистрация ITAR",
  },

  // Manufacturers
  "mfg.title": { en: "Authorized Manufacturers", ru: "Авторизованные производители" },
  "mfg.products": { en: "products", ru: "товаров" },

  // Auth
  "auth.login": { en: "Sign In", ru: "Войти" },
  "auth.register": { en: "Sign Up", ru: "Регистрация" },
  "auth.password": { en: "Password", ru: "Пароль" },
  "auth.full_name": { en: "Full Name", ru: "ФИО" },
  "auth.company": { en: "Company", ru: "Компания" },
  "auth.error": { en: "Error", ru: "Ошибка" },
  "auth.check_email": { en: "Check your email", ru: "Проверьте почту" },
  "auth.confirm_sent": { en: "Confirmation email sent", ru: "Письмо с подтверждением отправлено" },
  "auth.reset_sent": { en: "Password reset email sent", ru: "Письмо для сброса пароля отправлено" },
  "auth.forgot_password": { en: "Forgot password?", ru: "Забыли пароль?" },
  "auth.reset_password": { en: "Reset Password", ru: "Сброс пароля" },
  "auth.send_reset": { en: "Send Reset Link", ru: "Отправить ссылку" },
  "auth.back_login": { en: "Back to login", ru: "Назад к входу" },
  "auth.google": { en: "Sign in with Google", ru: "Войти через Google" },
  "auth.new_password": { en: "New Password", ru: "Новый пароль" },
  "auth.update_password": { en: "Update Password", ru: "Обновить пароль" },
  "auth.password_updated": { en: "Password updated", ru: "Пароль обновлён" },
  "auth.invalid_link": { en: "Invalid or expired link", ru: "Недействительная или просроченная ссылка" },

  // Account
  "account.title": { en: "My Account", ru: "Личный кабинет" },
  "account.logout": { en: "Sign Out", ru: "Выйти" },
  "account.profile": { en: "Profile", ru: "Профиль" },
  "account.orders": { en: "Order History", ru: "История заказов" },
  "account.phone": { en: "Phone", ru: "Телефон" },
  "account.inn": { en: "INN (Tax ID)", ru: "ИНН" },
  "account.save": { en: "Save", ru: "Сохранить" },
  "account.saved": { en: "Profile saved", ru: "Профиль сохранён" },
  "account.no_orders": { en: "No orders yet", ru: "Заказов пока нет" },
  "account.order_number": { en: "Order #", ru: "Заказ №" },
  "account.date": { en: "Date", ru: "Дата" },
  "account.status": { en: "Status", ru: "Статус" },
  "account.total": { en: "Total", ru: "Сумма" },

  // Header auth
  "header.my_account": { en: "My Account", ru: "Личный кабинет" },
  "header.login": { en: "Sign In", ru: "Войти" },

  // Cart
  "cart.title": { en: "Shopping Cart", ru: "Корзина" },
  "cart.empty": { en: "Cart is empty", ru: "Корзина пуста" },
  "cart.empty_desc": { en: "Add components from the catalog to get started.", ru: "Добавьте компоненты из каталога, чтобы начать." },
  "cart.to_catalog": { en: "Go to Catalog", ru: "Перейти в каталог" },
  "cart.summary": { en: "Order Summary", ru: "Итого" },
  "cart.items_count": { en: "Items", ru: "Штук" },
  "cart.positions": { en: "Positions", ru: "Позиций" },
  "cart.place_order": { en: "Place Order", ru: "Оформить заказ" },
  "cart.login_to_order": { en: "Sign in to order", ru: "Войдите для заказа" },
  "cart.login_hint": { en: "You need to sign in to place an order", ru: "Для оформления заказа необходимо войти в аккаунт" },
  "cart.clear": { en: "Clear Cart", ru: "Очистить корзину" },
  "cart.continue_shopping": { en: "Continue Shopping", ru: "Продолжить покупки" },
  "cart.order_placed": { en: "Order placed!", ru: "Заказ оформлен!" },
  "cart.added": { en: "Added to cart", ru: "Добавлено в корзину" },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("sibmicro-lang");
    return (saved === "ru" || saved === "en") ? saved : "ru";
  });

  const changeLang = useCallback((newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem("sibmicro-lang", newLang);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[key]?.[lang] ?? key,
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
