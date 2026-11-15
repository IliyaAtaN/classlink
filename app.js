// تنظیمات مرکزی سازنده سایت و اطلاعات تماس
const CONFIG = {
    developerName: "عطا",
    telegramId: "Ata_iii"
};

let allContacts = [];
let currentTab = 'students'; // پیش‌فرض روی دانش‌آموزان
let searchTimeout = null;

// المان‌های DOM
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const resultsCount = document.getElementById('resultsCount');
const contactsGrid = document.getElementById('contactsGrid');
const emptyState = document.getElementById('emptyState');
const recommendationCard = document.getElementById('recommendationCard');
const recommendTelegramBtn = document.getElementById('recommendTelegramBtn');
const developerNameEl = document.getElementById('developerName');
const developerTelegramEl = document.getElementById('developerTelegram');
const updateModal = document.getElementById('updateModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const changelogModal = document.getElementById('changelogModal');
const versionBtn = document.getElementById('versionBtn');
const closeChangelogBtn = document.getElementById('closeChangelogBtn');
const searchLoading = document.getElementById('searchLoading');
const tabButtons = document.querySelectorAll('.tab-btn');
const themeSwitcher = document.querySelector('.theme-switcher');
const tabsSection = document.querySelector('.tabs-section');

// مقداردهی اولیه اطلاعات سازنده در فوتر و کارت معرفی
function initDeveloperInfo() {
    if (developerNameEl) developerNameEl.textContent = CONFIG.developerName;
    if (developerTelegramEl) {
        developerTelegramEl.textContent = `@${CONFIG.telegramId}`;
        developerTelegramEl.href = `https://t.me/${CONFIG.telegramId}`;
    }
    if (recommendTelegramBtn) {
        recommendTelegramBtn.href = `https://t.me/${CONFIG.telegramId}`;
    }
}

// مدیریت سیستم پاپ‌آپ آپدیت و تاریخچه نسخه‌ها
function initModals() {
    const hasSeenUpdate = localStorage.getItem('class_directory_v02_seen');
    if (!hasSeenUpdate) {
        updateModal.classList.remove('hidden');
    }

    closeModalBtn.addEventListener('click', () => {
        updateModal.classList.add('hidden');
        localStorage.setItem('class_directory_v02_seen', 'true');
    });

    versionBtn.addEventListener('click', () => {
        changelogModal.classList.remove('hidden');
    });

    closeChangelogBtn.addEventListener('click', () => {
        changelogModal.classList.add('hidden');
    });
}

// مدیریت سیستم تغییر تم همراه با صفت اسلایدی
function initTheme() {
    const savedTheme = localStorage.getItem('class_directory_theme') || 'dark';
    setTheme(savedTheme);

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setTheme(theme);
            localStorage.setItem('class_directory_theme', theme);
        });
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeSwitcher) {
        themeSwitcher.setAttribute('data-active-theme', theme);
    }
    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// راه‌اندازی تب‌ها همراه با انیمیشن اسلایدی و کشسانی
function initTabs() {
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.getAttribute('data-tab');
            if (tabsSection) {
                tabsSection.setAttribute('data-active-tab', currentTab);
            }
            searchInput.value = '';
            clearSearchBtn.classList.add('hidden');
            searchLoading.classList.add('hidden');
            showInitialState();
        });
    });
    if (tabsSection) {
        tabsSection.setAttribute('data-active-tab', currentTab);
    }
}

// بارگذاری مخاطبین از فایل JSON محلی
async function loadContacts() {
    try {
        const response = await fetch('data/contacts.json');
        if (!response.ok) throw new Error(`خطا در سرور: ${response.status}`);
        
        allContacts = await response.json();
        showInitialState();
    } catch (error) {
        console.error('خطا در بارگذاری مخاطبین:', error);
        resultsCount.textContent = 'خطا در بارگذاری اطلاعات!';
        contactsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #ef4444; background: var(--surface); border-radius: 12px;">
                <h4>خطا در خواندن فایل اطلاعات!</h4>
                <p style="margin-top: 8px; font-size: 0.85rem; color: var(--text-muted);">مطمئن شوید پروژه را با سرور پایتون (http://localhost:8000) اجرا کرده‌اید.</p>
            </div>
        `;
    }
}

// فیلتر کردن دقیق بر اساس تب فعال
function getFilteredContacts() {
    return allContacts.filter(c => {
        const role = (c.role || 'student').toLowerCase();
        if (currentTab === 'students') {
            return role === 'student' || role === 'students';
        } else {
            return role === 'teacher' || role === 'teachers';
        }
    });
}

// نمایش حالت اولیه: نمایش ۴ کارت نمونه + دکمه لود تنبل و اسکرول نرم به پایین
function showInitialState() {
    contactsGrid.innerHTML = '';
    contactsGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    const tabFiltered = getFilteredContacts();
    const previewContacts = tabFiltered.slice(0, 4);

    if (previewContacts.length === 0) {
        contactsGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        resultsCount.textContent = 'موردی در این بخش یافت نشد';
        return;
    }

    renderCards(previewContacts, false);

    if (tabFiltered.length > 4) {
        const viewMoreContainer = document.createElement('div');
        viewMoreContainer.className = 'view-more-container';
        viewMoreContainer.innerHTML = `
            <button id="viewMoreBtn" class="view-more-btn">
                <i class="fa-solid fa-chevron-down"></i> مشاهده بقیه موارد (${tabFiltered.length - 4} نفر دیگر)
            </button>
        `;
        contactsGrid.appendChild(viewMoreContainer);

        // دکمه مشاهده بیشتر: اسکرول نرم به سمت پایین + لود آبشاری کارت‌ها
        document.getElementById('viewMoreBtn').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> در حال بارگذاری موارد...`;
            btn.style.opacity = '0.8';
            btn.style.pointerEvents = 'none';

            // اسکرول نرم صفحه به سمت پایین
            window.scrollBy({
                top: 250,
                behavior: 'smooth'
            });

            // مکث کوتاه و نمایش آبشاری کارت‌ها
            setTimeout(() => {
                renderCards(tabFiltered, true);
            }, 350);
        });
    }

    resultsCount.textContent = `آماده جستجو (${tabFiltered.length} مخاطب)`;
}

// تابع رندر کردن کارت‌ها با قابلیت انیمیشن تدریجی و آبشاری (Staggered Animation)
function renderCards(contactsToRender, isStaggered = false) {
    contactsGrid.innerHTML = '';

    contactsToRender.forEach((contact, index) => {
        const card = document.createElement('div');
        card.className = isStaggered ? 'contact-card stagger-item' : 'contact-card';
        
        if (isStaggered) {
            // تاخیر افزایشی برای هر کارت برای ایجاد افکت لود آبشاری
            card.style.animationDelay = `${index * 0.07}s`;
        }

        const initials = contact.first_name ? contact.first_name.charAt(0) : '👤';
        const roleType = (contact.role || 'student').toLowerCase();
        const badgeHtml = (roleType === 'teacher' || roleType === 'teachers') ? `<span class="teacher-badge">${contact.title || 'استاد'}</span>` : '';

        card.innerHTML = `
            <div class="contact-header">
                <div class="contact-user-info">
                    <div class="contact-avatar">${initials}</div>
                    <div class="contact-name">${contact.first_name} ${contact.last_name}</div>
                </div>
                ${badgeHtml}
            </div>
            <div class="contact-details">
                <div class="contact-item">
                    <div class="label-val">
                        <i class="fa-solid fa-phone"></i>
                        <span>${contact.phone}</span>
                    </div>
                    <div class="action-btns">
                        <a href="tel:${contact.phone}" class="icon-btn" title="تماس مستقیم">
                            <i class="fa-solid fa-phone-flip"></i>
                        </a>
                        <button class="icon-btn copy-btn" data-clipboard="${contact.phone}" title="کپی شماره تلفن">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                    </div>
                </div>
                <div class="contact-item">
                    <div class="label-val">
                        <i class="fa-brands fa-telegram"></i>
                        <a href="https://t.me/${contact.telegram_id}" target="_blank" class="telegram-link">@${contact.telegram_id}</a>
                    </div>
                    <div class="action-btns">
                        <button class="icon-btn copy-btn" data-clipboard="${contact.telegram_id}" title="کپی آیدی تلگرام">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        contactsGrid.appendChild(card);
    });

    attachCopyEvents();
}

// مدیریت کپی کردن
function attachCopyEvents() {
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const textToCopy = button.getAttribute('data-clipboard');
            try {
                await navigator.clipboard.writeText(textToCopy);
                const icon = button.querySelector('i');
                icon.className = 'fa-solid fa-check';
                button.classList.add('copied');
                
                setTimeout(() => {
                    icon.className = 'fa-regular fa-copy';
                    button.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
    });
}

// منطق جستجوی زنده
function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();

    if (query.length > 0) {
        clearSearchBtn.classList.remove('hidden');
        searchLoading.classList.remove('hidden');
        resultsCount.textContent = 'در حال جستجو...';

        if (searchTimeout) clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
            const tabFiltered = getFilteredContacts();
            const filtered = tabFiltered.filter(contact => {
                const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
                const phone = contact.phone.toLowerCase();
                const telegram = contact.telegram_id.toLowerCase();

                return fullName.includes(query) || 
                       contact.first_name.toLowerCase().includes(query) || 
                       contact.last_name.toLowerCase().includes(query) || 
                       phone.includes(query) || 
                       telegram.includes(query);
            });

            searchLoading.classList.add('hidden');

            if (filtered.length === 0) {
                contactsGrid.classList.add('hidden');
                emptyState.classList.remove('hidden');
                resultsCount.textContent = 'نتیجه‌ای یافت نشد';
            } else {
                contactsGrid.classList.remove('hidden');
                emptyState.classList.add('hidden');
                renderCards(filtered, true); // جستجو با انیمیشن آبشاری
                resultsCount.textContent = `تعداد نتایج یافت شده: ${filtered.length} نفر`;
            }
        }, 300);

    } else {
        clearSearchBtn.classList.add('hidden');
        searchLoading.classList.add('hidden');
        if (searchTimeout) clearTimeout(searchTimeout);
        showInitialState();
    }
}

// رویدادها
searchInput.addEventListener('input', handleSearch);

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    searchLoading.classList.add('hidden');
    showInitialState();
    searchInput.focus();
});

// راه‌اندازی اولیه برنامه
document.addEventListener('DOMContentLoaded', () => {
    initDeveloperInfo();
    initTheme();
    initTabs();
    initModals();
    loadContacts();
});