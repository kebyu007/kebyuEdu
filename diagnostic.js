const assert = require('assert');

async function run() {
  console.log("🚀 ERP Tizimini avtomatik diagnostika qilish boshlandi...");

  try {
    // 1. Login
    console.log("1. SuperAdmin orqali Login qilinmoqda...");
    let res = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+998933921177', password: '123456' })
    });
    let data = await res.json();
    if (!data.access_token) {
      console.log("LOGIN XATOSI:", data);
    }
    assert(data.access_token, "Login muvaffaqiyatsiz, token olinmadi");
    const token = data.access_token;
    console.log("✅ Login muvaffaqiyatli! Token olingan.");

    // 2. Check Reports
    console.log("2. Dashboard hisobotlari tekshirilmoqda...");
    res = await fetch('http://localhost:3000/api/v1/reports/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await res.json();
    assert(data.financial !== undefined, "Dashboard datasi noto'g'ri");
    console.log("✅ Reports API muvaffaqiyatli ishladi. Daromad:", data.financial.totalRevenue);

    // 3. Create Course
    console.log("3. Yangi kurs yaratilmoqda...");
    res = await fetch('http://localhost:3000/api/v1/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'Oliygohga Tayyorlov ' + Date.now(), price: 1000000, duration_hours: 48, duration_month: 4 })
    });
    data = await res.json();
    assert(data.id, "Kurs yaratishda xatolik");
    console.log("✅ Yangi kurs muvaffaqiyatli yaratildi: ID " + data.id);

    console.log("🎉 BARCHA ASOSIY MODULLAR XATOSIZ ISHLAMOQDA! Tizim jangovar holatda!");
  } catch (error) {
    console.error("❌ XATOLIK YUZ BERDI:", error.message);
  }
}

run();
