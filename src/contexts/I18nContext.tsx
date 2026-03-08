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
  "catalog.title": { en: "Product Catalog", ru: "Категории продукции" },
  "catalog.results_for": { en: "Results for", ru: "Результаты для" },
  "catalog.products_found": { en: "products found", ru: "товаров найдено" },
  "catalog.shown_of": { en: "Shown", ru: "Показано" },
  "catalog.of": { en: "of", ru: "из" },
  "catalog.products": { en: "products", ru: "товаров" },
  "catalog.filters": { en: "Filters", ru: "Фильтры" },
  "catalog.export": { en: "Export", ru: "Экспорт" },
  "catalog.part_number": { en: "Part Number", ru: "Артикул" },
  "catalog.manufacturer": { en: "Manufacturer", ru: "Производитель" },
  "catalog.description": { en: "Description", ru: "Характеристики" },
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
  "catalog.on_order": { en: "On Order", ru: "Под заказ" },
  "catalog.preorder": { en: "Preorder", ru: "Предзаказ" },
  "catalog.contact": { en: "Contact", ru: "По запросу" },
  "catalog.home": { en: "Home", ru: "Главная" },
  "catalog.in_stock_only": { en: "In stock only", ru: "Только в наличии" },
  "catalog.authorized": { en: "Authorized", ru: "Авторизованные" },
  "catalog.search_placeholder": { en: "Search by part number, name or manufacturer...", ru: "Поиск по артикулу, названию или производителю..." },
  "catalog.search_manufacturer": { en: "Search manufacturer...", ru: "Поиск производителя..." },
  "catalog.category": { en: "Category", ru: "Категория" },
  "catalog.add_to_cart": { en: "Add to Cart", ru: "В корзину" },
  "catalog.upload_bom": { en: "Upload BOM", ru: "Загрузить BOM" },

  // Smart Search
  "smart_search.products": { en: "products", ru: "товаров" },
  "smart_search.popular": { en: "Popular searches", ru: "Популярные запросы" },
  "smart_search.parts": { en: "Parts", ru: "Компоненты" },
  "smart_search.manufacturers": { en: "Manufacturers", ru: "Производители" },
  "smart_search.categories": { en: "Categories", ru: "Категории" },
  "smart_search.search_all": { en: "Search all for", ru: "Искать всё по запросу" },

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

  // Order detail
  "order.not_found": { en: "Order not found", ru: "Заказ не найден" },
  "order.back_to_orders": { en: "Back to orders", ru: "Назад к заказам" },
  "order.part_number": { en: "Part Number", ru: "Артикул" },
  "order.manufacturer": { en: "Manufacturer", ru: "Производитель" },
  "order.quantity": { en: "Qty", ru: "Кол-во" },
  "order.unit_price": { en: "Unit Price", ru: "Цена за шт." },

  // Octopart
  "octopart.title": { en: "Part Search (Octopart)", ru: "Поиск деталей (Octopart)" },
  "octopart.subtitle": {
    en: "Search millions of electronic components. Real-time pricing and stock from authorized distributors.",
    ru: "Поиск миллионов электронных компонентов. Актуальные цены и наличие от авторизованных дистрибьюторов.",
  },
  "octopart.search_placeholder": { en: "e.g. STM32F103, LM7805, 100nF...", ru: "напр. STM32F103, LM7805, 100nF..." },
  "octopart.found": { en: "Found", ru: "Найдено" },
  "octopart.results": { en: "results", ru: "результатов" },
  "octopart.close": { en: "Close", ru: "Закрыть" },
  "octopart.sellers": { en: "Distributors & Pricing", ru: "Дистрибьюторы и цены" },
  "octopart.nav": { en: "Part Search", ru: "Поиск деталей" },
  "octopart.searching": { en: "Searching Octopart...", ru: "Поиск в Octopart..." },
  "octopart.fallback_hint": {
    en: "No local results found — showing results from Octopart",
    ru: "Локальных результатов нет — показаны результаты из Octopart",
  },

  // External search / unified table
  "ext.all_sources": { en: "All sources", ru: "Все источники" },
  "ext.source": { en: "Source", ru: "Источник" },
  "ext.sort_label": { en: "Sort", ru: "Сортировка" },
  "ext.sort_price": { en: "price", ru: "цена" },
  "ext.sort_stock": { en: "stock", ru: "наличие" },
  "ext.sort_mpn": { en: "part number", ru: "артикул" },
  "ext.sort_manufacturer": { en: "manufacturer", ru: "производитель" },
  "ext.sort_source": { en: "source", ru: "источник" },
  "ext.digikey_price_tiers": { en: "DigiKey Price Tiers", ru: "Ценовые уровни DigiKey" },
  "ext.searching_all": { en: "Searching all sources...", ru: "Поиск по всем источникам..." },

  // Footer product links
  "footer.semiconductors": { en: "Semiconductors", ru: "Полупроводники" },
  "footer.passive": { en: "Passive Components", ru: "Пассивные компоненты" },
  "footer.rf": { en: "RF & Microwave", ru: "ВЧ и СВЧ" },
  "footer.connectors": { en: "Connectors", ru: "Разъёмы" },

  // 404
  "notfound.text": { en: "Oops! Page not found", ru: "Страница не найдена" },
  "notfound.back": { en: "Return to Home", ru: "На главную" },

  // Quote
  "quote.title": { en: "Request a Quote", ru: "Запрос цены" },
  "quote.subtitle": {
    en: "Fill in the form and we'll get back to you with pricing and availability.",
    ru: "Заполните форму, и мы свяжемся с вами по вопросам цены и наличия.",
  },
  "quote.name": { en: "Name", ru: "Имя" },
  "quote.phone": { en: "Phone", ru: "Телефон" },
  "quote.company": { en: "Company", ru: "Компания" },
  "quote.part_numbers": { en: "Part Numbers", ru: "Номера деталей" },
  "quote.part_numbers_hint": { en: "One per line, e.g. STM32F103C8T6", ru: "По одному на строку, напр. STM32F103C8T6" },
  "quote.quantities": { en: "Quantities", ru: "Количество" },
  "quote.quantities_hint": { en: "e.g. 100, 500, 1000", ru: "напр. 100, 500, 1000" },
  "quote.message": { en: "Message", ru: "Сообщение" },
  "quote.submit": { en: "Submit Request", ru: "Отправить запрос" },
  "quote.success_title": { en: "Request Sent!", ru: "Запрос отправлен!" },
  "quote.success_desc": {
    en: "We'll review your request and respond shortly.",
    ru: "Мы рассмотрим ваш запрос и свяжемся с вами в ближайшее время.",
  },

  // Contact page
  "contact.title": { en: "Contact Us", ru: "Контакты" },
  "contact.subtitle": {
    en: "Get in touch with our team. We're here to help with your electronic component needs.",
    ru: "Свяжитесь с нашей командой. Мы готовы помочь с подбором электронных компонентов.",
  },
  "contact.info_title": { en: "Contact Information", ru: "Контактная информация" },
  "contact.address": { en: "Address", ru: "Адрес" },
  "contact.address_value": { en: "Moscow, Russia, Presnenskaya nab. 12", ru: "Москва, Пресненская наб. 12" },
  "contact.phone": { en: "Phone", ru: "Телефон" },
  "contact.email": { en: "Email", ru: "Электронная почта" },
  "contact.hours": { en: "Working Hours", ru: "Режим работы" },
  "contact.hours_value": { en: "Mon–Fri 9:00–18:00 (MSK)", ru: "Пн–Пт 9:00–18:00 (МСК)" },
  "contact.form_title": { en: "Send us a message", ru: "Написать нам" },
  "contact.name": { en: "Name", ru: "Имя" },
  "contact.message": { en: "Message", ru: "Сообщение" },
  "contact.subject": { en: "Subject", ru: "Тема" },
  "contact.send": { en: "Send Message", ru: "Отправить сообщение" },
  "contact.sent_title": { en: "Message Sent!", ru: "Сообщение отправлено!" },
  "contact.sent_desc": {
    en: "We'll get back to you as soon as possible.",
    ru: "Мы ответим вам в ближайшее время.",
  },

  // Resources page
  "res.title": { en: "Technical Resources", ru: "Техническая документация" },
  "res.subtitle": {
    en: "Datasheets, application notes, design guides and useful tools for electronics engineers.",
    ru: "Даташиты, аппноуты, руководства по проектированию и полезные инструменты для инженеров-электронщиков.",
  },
  "res.datasheets": { en: "Datasheets", ru: "Даташиты" },
  "res.datasheets_desc": {
    en: "Access manufacturer datasheets for all components in our catalog. Search by part number to find detailed specifications.",
    ru: "Доступ к даташитам производителей на все компоненты из нашего каталога. Ищите по номеру детали.",
  },
  "res.app_notes": { en: "Application Notes", ru: "Аппноуты" },
  "res.app_notes_desc": {
    en: "Practical design examples and implementation guides from leading manufacturers.",
    ru: "Практические примеры проектирования и руководства по реализации от ведущих производителей.",
  },
  "res.design_tools": { en: "Design Tools", ru: "Инструменты проектирования" },
  "res.design_tools_desc": {
    en: "Online calculators, simulation tools, and PCB design resources to accelerate your development.",
    ru: "Онлайн-калькуляторы, инструменты моделирования и ресурсы для проектирования печатных плат.",
  },
  "res.standards": { en: "Standards & Compliance", ru: "Стандарты и сертификация" },
  "res.standards_desc": {
    en: "Information on RoHS, REACH, ITAR and other regulatory compliance for electronic components.",
    ru: "Информация о RoHS, REACH, ITAR и других нормативных требованиях к электронным компонентам.",
  },
  "res.faq": { en: "FAQ", ru: "Часто задаваемые вопросы" },
  "res.faq_desc": {
    en: "Answers to common questions about ordering, shipping, and technical support.",
    ru: "Ответы на частые вопросы о заказах, доставке и технической поддержке.",
  },
  "res.useful_links": { en: "Useful Links", ru: "Полезные ссылки" },
  "res.search_catalog": { en: "Search Catalog", ru: "Искать в каталоге" },
  "res.visit": { en: "Visit", ru: "Перейти" },

  // BOM page
  "bom.title": { en: "BOM Upload", ru: "Загрузка BOM" },
  "bom.subtitle": {
    en: "Upload your Bill of Materials (CSV or Excel) to quickly search availability and pricing.",
    ru: "Загрузите спецификацию материалов (CSV или Excel) для быстрого поиска наличия и цен.",
  },
  "bom.drop_zone": { en: "Drag & drop your BOM file here, or click to browse", ru: "Перетащите BOM-файл сюда или нажмите для выбора" },
  "bom.supported": { en: "Supported formats: CSV, XLS, XLSX", ru: "Поддерживаемые форматы: CSV, XLS, XLSX" },
  "bom.col_part": { en: "Part Number column", ru: "Столбец номера детали" },
  "bom.col_qty": { en: "Quantity column", ru: "Столбец количества" },
  "bom.col_desc": { en: "Description column (optional)", ru: "Столбец описания (необязательно)" },
  "bom.preview": { en: "Preview", ru: "Предпросмотр" },
  "bom.part_number": { en: "Part Number", ru: "Номер детали" },
  "bom.quantity": { en: "Qty", ru: "Кол-во" },
  "bom.description": { en: "Description", ru: "Описание" },
  "bom.search_all": { en: "Search All Parts", ru: "Искать все детали" },
  "bom.clear": { en: "Clear", ru: "Очистить" },
  "bom.rows_loaded": { en: "rows loaded", ru: "строк загружено" },
  "bom.no_file": { en: "No file loaded", ru: "Файл не загружен" },
  "bom.error_parse": { en: "Failed to parse file", ru: "Ошибка парсинга файла" },
  "bom.request_quote": { en: "Request Quote for All", ru: "Запросить цену на всё" },
} as const;

// Category & subcategory localization map (key = English name)
const categoryNames: Record<string, { en: string; ru: string }> = {
  // Categories
  "Semiconductors": { en: "Semiconductors", ru: "Полупроводники" },
  "Microcontrollers": { en: "Microcontrollers", ru: "Микроконтроллеры" },
  "Memory": { en: "Memory", ru: "Память" },
  "Passive Components": { en: "Passive Components", ru: "Пассивные компоненты" },
  "RF & Microwave": { en: "RF & Microwave", ru: "Радиочастотные модули" },
  "Sensors": { en: "Sensors", ru: "Сенсоры" },
  "Connectors": { en: "Connectors", ru: "Разъёмы" },
  "Power Electronics": { en: "Power Electronics", ru: "Силовая электроника" },
  "Test & Measurement": { en: "Test & Measurement", ru: "Измерительное оборудование" },
  "Tools": { en: "Tools", ru: "Инструменты" },
  "Optoelectronics": { en: "Optoelectronics", ru: "Оптоэлектроника" },
  // Subcategories
  "RF Amplifiers": { en: "RF Amplifiers", ru: "ВЧ усилители" },
  "RF Mixers": { en: "RF Mixers", ru: "ВЧ смесители" },
  "RF Switches": { en: "RF Switches", ru: "ВЧ переключатели" },
  "ADC / DAC": { en: "ADC / DAC", ru: "АЦП / ЦАП" },
  "Power Management ICs": { en: "Power Management ICs", ru: "Микросхемы управления питанием" },
  "ARM Cortex-M": { en: "ARM Cortex-M", ru: "ARM Cortex-M" },
  "AVR": { en: "AVR", ru: "AVR" },
  "PIC": { en: "PIC", ru: "PIC" },
  "RISC-V": { en: "RISC-V", ru: "RISC-V" },
  "SRAM": { en: "SRAM", ru: "SRAM" },
  "DRAM": { en: "DRAM", ru: "DRAM" },
  "Flash": { en: "Flash", ru: "Flash" },
  "EEPROM": { en: "EEPROM", ru: "EEPROM" },
  "Capacitors": { en: "Capacitors", ru: "Конденсаторы" },
  "Resistors": { en: "Resistors", ru: "Резисторы" },
  "Inductors": { en: "Inductors", ru: "Катушки индуктивности" },
  "Ferrite Beads": { en: "Ferrite Beads", ru: "Ферритовые бусины" },
  "Power Amplifiers": { en: "Power Amplifiers", ru: "Усилители мощности" },
  "LNAs": { en: "LNAs", ru: "МШУ (LNA)" },
  "Attenuators": { en: "Attenuators", ru: "Аттенюаторы" },
  "RF Modules": { en: "RF Modules", ru: "ВЧ модули" },
  "Filters": { en: "Filters", ru: "Фильтры" },
  "Temperature Sensors": { en: "Temperature Sensors", ru: "Датчики температуры" },
  "Pressure Sensors": { en: "Pressure Sensors", ru: "Датчики давления" },
  "Accelerometers": { en: "Accelerometers", ru: "Акселерометры" },
  "Gyroscopes": { en: "Gyroscopes", ru: "Гироскопы" },
  "Proximity Sensors": { en: "Proximity Sensors", ru: "Датчики приближения" },
  "RF Connectors": { en: "RF Connectors", ru: "ВЧ разъёмы" },
  "Board-to-Board": { en: "Board-to-Board", ru: "Плата-плата" },
  "Wire-to-Board": { en: "Wire-to-Board", ru: "Провод-плата" },
  "DC-DC Converters": { en: "DC-DC Converters", ru: "DC-DC преобразователи" },
  "AC-DC Power Supplies": { en: "AC-DC Power Supplies", ru: "AC-DC источники питания" },
  "MOSFETs": { en: "MOSFETs", ru: "МОП-транзисторы" },
  "IGBTs": { en: "IGBTs", ru: "IGBT транзисторы" },
  "Oscilloscope Probes": { en: "Oscilloscope Probes", ru: "Пробники осциллографов" },
  "Signal Generators": { en: "Signal Generators", ru: "Генераторы сигналов" },
  "Spectrum Analyzers": { en: "Spectrum Analyzers", ru: "Анализаторы спектра" },
  "Soldering Stations": { en: "Soldering Stations", ru: "Паяльные станции" },
  "Hand Tools": { en: "Hand Tools", ru: "Ручные инструменты" },
  "Rework Stations": { en: "Rework Stations", ru: "Ремонтные станции" },
  "LEDs": { en: "LEDs", ru: "Светодиоды" },
  "Photodiodes": { en: "Photodiodes", ru: "Фотодиоды" },
  "Laser Diodes": { en: "Laser Diodes", ru: "Лазерные диоды" },
};

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  tc: (name: string) => string;
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

  const tc = useCallback(
    (name: string) => categoryNames[name]?.[lang] ?? name,
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang: changeLang, t, tc }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
