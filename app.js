// تنظیمات مرکزی سازنده سایت و اطلاعات تماس
const CONFIG = {
    developerName: "عطا",
    telegramId: "Ata_iii"
};

let allContacts = [];

// المان‌های DOM
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const resultsCount = document.getElementById('resultsCount');
const contactsGrid = document.getElementById('contactsGrid');
const emptyState = document.getElementById('emptyState');
const emptyIconWrap = document.getElementById('emptyIconWrap');
const emptyTitle = document.getElementById('emptyTitle');
const emptyDesc = document.getElementById('emptyDesc');
const recommendationCard = document.getElementById('recommendationCard');
const recommendTelegramBtn = document.getElementById('recommendTelegramBtn');
const developerNameEl = document.getElementById('developerName');
const developerTelegramEl = document.getElementById('developerTelegram');

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

// مدیریت سیستم تغییر تم (تیره، روشن، دخترونه)
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
    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// بارگذاری مخاطبین از فایل JSON محلی
async function loadContacts() {
    try {
        const response = await fetch('data/contacts.json');
        if (!response.ok) throw new Error('خطا در دریافت اطلاعات فایل داده‌ها');
        allContacts = await response.json();
        
        showInitialState();
    } catch (error) {
        console.error('Error loading contacts:', error);
        resultsCount.textContent = 'خطا در بارگذاری اطلاعات!';
    }
}

// نمایش حالت اولیه (قبل از جستجو - بدون پیام خطا)
function showInitialState() {
    contactsGrid.innerHTML = '';
    contactsGrid.classList.add('hidden');
    emptyState.classList.remove('hidden');
    
    emptyIconWrap.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
    emptyTitle.textContent = 'جستجو در دفترچه تلفن کلاس';
    emptyDesc.textContent = `کلا شماره ${allContacts.length} تا همکلاسی رو داریم`;
    recommendationCard.style.display = 'none'; // پنهان کردن باکس معرفی در حالت اولیه
    resultsCount.textContent = `آماده جستجو (${allContacts.length} مخاطب)`;
}

// رندر کردن کارت‌های همکلاسی‌ها در صفحه
function renderContacts(contacts, isSearching) {
    contactsGrid.innerHTML = '';

    if (!isSearching) {
        showInitialState();
        return;
    }

    if (contacts.length === 0) {
        contactsGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        
        emptyIconWrap.innerHTML = '<i class="fa-solid fa-user-slash"></i>';
        emptyTitle.textContent = 'ریدی پسر کسی پیدا نشد';
        emptyDesc.textContent = 'کسی با این مشخصات پیدا نشد';
        recommendationCard.style.display = 'flex'; // نمایش باکس معرفی دانش‌آموز در صورت نبود نتیجه
        
        resultsCount.textContent = 'نتیجه‌ای یافت نشد';
        return;
    }

    contactsGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    contacts.forEach(contact => {
        const card = document.createElement('div');
        card.className = 'contact-card';

        const initials = contact.first_name ? contact.first_name.charAt(0) : '👤';

        card.innerHTML = `
            <div class="contact-header">
                <div class="contact-avatar">${initials}</div>
                <div class="contact-name">${contact.first_name} ${contact.last_name}</div>
            </div>
            <div class="contact-details">
                <div class="contact-item">
                    <div class="label-val">
                        <i class="fa-solid fa-phone"></i>
                        <span>${contact.phone}</span>
                    </div>
                    <div class="action-icons">
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
                    <div class="action-icons">
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

// مدیریت کپی کردن شماره و آیدی تلگرام با بازخورد بصری
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

// منطق جستجوی زنده (Live Search)
function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();

    if (query.length > 0) {
        clearSearchBtn.classList.remove('hidden');
        
        const filtered = allContacts.filter(contact => {
            const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
            const phone = contact.phone.toLowerCase();
            const telegram = contact.telegram_id.toLowerCase();

            return fullName.includes(query) || 
                   contact.first_name.toLowerCase().includes(query) || 
                   contact.last_name.toLowerCase().includes(query) || 
                   phone.includes(query) || 
                   telegram.includes(query);
        });

        renderContacts(filtered, true);
        resultsCount.textContent = `تعداد نتایج یافت شده: ${filtered.length} نفر`;
    } else {
        clearSearchBtn.classList.add('hidden');
        showInitialState();
    }
}

// رویدادها
searchInput.addEventListener('input', handleSearch);

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    showInitialState();
    searchInput.focus();
});

// راه‌اندازی اولیه برنامه
document.addEventListener('DOMContentLoaded', () => {
    initDeveloperInfo();
    initTheme();
    loadContacts();
});