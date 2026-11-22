<!DOCTYPE html>
<html lang="ps" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="کړاوونه — د پښتو ادب، شعرونو، غزلونو او ټپیزو ډیجیټل ټولګه" />
  <meta http-equiv="X-Content-Type-Options" content="nosniff" />
  <title>کړاوونه | شعري او ادبي ټولګه</title>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Vazirmatn:wght@400;500;600;700&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="css/style.css?v=2" />
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <div class="brand">
        <div class="brand-emblem" aria-hidden="true">ک</div>
        <div>
          <h1 class="brand-title">کړاوونه</h1>
          <p class="brand-subtitle">د پښتو ادب، احساس او شعرونو ډیجیټل ټولګه</p>
        </div>
      </div>

      <nav class="header-actions" aria-label="د لوستلو تنظیمات">
        <button type="button" id="font-decrease-btn" class="tool-btn" title="لیک کوچنی کول" aria-label="لیک کوچنی کول">ا-</button>
        <button type="button" id="font-increase-btn" class="tool-btn" title="لیک لوی کول" aria-label="لیک لوی کول">ا+</button>
        <button type="button" id="theme-toggle-btn" class="tool-btn" title="د شپې او ورځې حالت" aria-label="د رنګ حالت بدلول">◐</button>
      </nav>
    </div>
  </header>

  <section class="hero-banner">
    <div class="container hero-content">
      <span class="hero-tag">ادبي او هنري ګالري</span>
      <h2>په تورو کې نغښتي احساسات او ژور خیالونه</h2>
      <p>دلته غوره غزلونه، ټپیزې او ادبي ټوټې په ارامه، ښکلې او معیاري فضا کې ولولئ او خپل نظر راسره شریک کړئ.</p>
    </div>
  </section>

  <main class="container main-layout">
    <section class="toolbar-card" aria-label="د شعرونو لټون او چاڼ">
      <div class="search-box">
        <input
          type="search"
          id="poem-search-input"
          placeholder="د شعر، شاعر یا کلمې له مخې لټون وکړئ..."
          aria-label="د شعرونو لټون"
        />
      </div>
      <div class="filter-box">
        <select id="poem-category-filter" aria-label="د شعر ډول انتخابول">
          <option value="ALL">ټولې برخې</option>
        </select>
      </div>
    </section>

    <section aria-labelledby="poems-section-title">
      <div class="section-heading">
        <h2 id="poems-section-title">غوره شعرونه</h2>
        <span class="section-line"></span>
      </div>
      <div id="poems-list" class="poems-grid">
        <p>شعرونه لودېږي...</p>
      </div>
    </section>

    <section class="feedback-section" aria-labelledby="feedback-section-title">
      <div class="feedback-card">
        <div class="feedback-header">
          <h2 id="feedback-section-title">نظر او پیغام</h2>
          <p>ستاسو ارزښتناک نظرونه او وړاندیزونه موږ ته د لا ښه کار الهام راکوي.</p>
        </div>

        <form id="feedback-form" novalidate>
          <div class="form-group">
            <label for="sender-name">ستاسو نوم</label>
            <input
              type="text"
              id="sender-name"
              name="name"
              maxlength="80"
              placeholder="خپل نوم ولیکئ (اختیاري)"
            />
          </div>

          <div class="form-group">
            <label for="feedback-message">نظر یا پیغام</label>
            <textarea
              id="feedback-message"
              name="message"
              rows="5"
              maxlength="1500"
              placeholder="خپل نظر، نیوکه یا وړاندیز دلته ولیکئ..."
              required
            ></textarea>
          </div>

          <button type="submit" class="btn-primary">لېږل</button>
          <p id="feedback-status" class="feedback-status" role="status" aria-live="polite"></p>
        </form>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p>© ۲۰۲۶ کړاوونه — ټول حقوق خوندي دي.</p>
      <a href="admin.html" class="admin-link">مدیریت</a>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="supabase-config.js?v=2"></script>
  <script src="js/app.js?v=2"></script>
</body>
</html> 
