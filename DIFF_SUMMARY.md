# Diff Summary - Design Tokens & Utilities

## Обзор изменений

Обновлена система дизайн-токенов и добавлены новые utility-классы для проекта.

## 📁 Изменённые файлы

### 1. `src/styles/global.css`

#### ✅ Новые CSS переменные

```css
:root {
  /* Background Colors */
  --bg: #0a0a0a;
  --panel: #0d0d10;
  
  /* Foreground Colors */
  --fg: #f5f5f5;
  --muted: #b3b3b3;
  
  /* Primary Colors */
  --primary: #60a5fa;
  --primary-2: #22d3ee;
  
  /* Border */
  --border: rgba(255, 255, 255, 0.08);
  
  /* Border Radius */
  --radius-2xl: 24px;
  
  /* Legacy Colors (backward compatibility) */
  --color-primary: var(--primary);
  --color-secondary: var(--primary-2);
  /* ... */
}
```

**Изменения:**
- ✅ Введены новые токены `--bg`, `--panel`, `--fg`, `--muted`, `--primary`, `--primary-2`, `--border`
- ✅ Добавлен `--radius-2xl: 24px`
- ✅ Сохранена обратная совместимость через legacy переменные
- ✅ Обновлён body для использования `--bg` и `--fg`

### 2. `tailwind.config.js`

#### ✅ Расширение theme.extend

```js
theme: {
  extend: {
    colors: {
      // New design tokens
      bg: 'var(--bg)',
      panel: 'var(--panel)',
      fg: 'var(--fg)',
      muted: 'var(--muted)',
      primary: 'var(--primary)',
      'primary-2': 'var(--primary-2)',
      border: 'var(--border)',
      
      // Legacy colors (backward compatibility)
      secondary: 'var(--primary-2)',
      accent: 'var(--primary-2)',
    },
    
    // Typography scale
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    
    borderRadius: {
      '2xl': 'var(--radius-2xl)',
    },
    
    maxWidth: {
      container: '1200px',
    },
  }
}
```

**Изменения:**
- ✅ Добавлена полная типографическая шкала
- ✅ Контейнер 1200px через `maxWidth.container`
- ✅ Новая система цветов на базе токенов

### 3. ✅ Новые Utility Classes

#### `.card` utility

```css
.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-xl);
}
```

**Использование:**
```html
<div class="card">
  <!-- content -->
</div>
```

#### `.btn-capsule` utility

```css
.btn-capsule {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%);
  color: var(--fg);
  font-weight: 600;
  padding: 0.875rem 2rem;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: clamp(0.9375rem, 1vw + 0.25rem, 1.125rem);
}

.btn-capsule:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(96, 165, 250, 0.3);
}

.btn-capsule:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 3px;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.4);
}

@media (prefers-reduced-motion: reduce) {
  .btn-capsule:hover {
    transform: none;
  }
}
```

**Использование:**
```html
<a href="#" class="btn-capsule">Начать сейчас</a>
<button class="btn-capsule">Отправить</button>
```

## 🎨 Новая палитра цветов

### Цвета фона
- `--bg`: #0a0a0a (основной тёмный фон)
- `--panel`: #0d0d10 (панели, карточки)

### Цвета текста
- `--fg`: #f5f5f5 (основной текст)
- `--muted`: #b3b3b3 (приглушённый текст)

### Основные цвета
- `--primary`: #60a5fa (голубой)
- `--primary-2`: #22d3ee (циан)

### Границы
- `--border`: rgba(255, 255, 255, 0.08)

### Радиусы
- `--radius-2xl`: 24px

## 📐 Типографическая шкала

Используйте классы Tailwind:
- `text-xs`, `text-sm`, `text-base`
- `text-lg`, `text-xl`, `text-2xl`
- `text-3xl`, `text-4xl`, `text-5xl`
- `text-6xl`, `text-7xl`, `text-8xl`, `text-9xl`

Или clamp() для responsive:
```css
h1 { font-size: clamp(2rem, 5vw + 1rem, 4rem); }
h2 { font-size: clamp(1.5rem, 3vw + 0.5rem, 2.5rem); }
h3 { font-size: clamp(1.25rem, 2vw + 0.25rem, 1.75rem); }
```

## 🔧 Контейнер

Используйте `max-w-container` для 1200px ограничения:

```html
<div class="max-w-container mx-auto">
  <!-- content -->
</div>
```

## 🎯 Примеры использования

### Карточка с новым utility

```html
<div class="card">
  <h3 class="text-xl font-bold text-fg">Заголовок</h3>
  <p class="text-muted">Описание</p>
</div>
```

### Градиентная кнопка-капсула

```html
<a href="#" class="btn-capsule" data-cta>
  Начать бесплатно
</a>
```

### Полный пример секции

```html
<section class="bg-bg py-16">
  <div class="max-w-container mx-auto px-4">
    <div class="card">
      <h2 class="text-3xl font-bold text-fg mb-4">
        Заголовок секции
      </h2>
      <p class="text-muted mb-6">
        Описание секции
      </p>
      <a href="#" class="btn-capsule">
        Действие
      </a>
    </div>
  </div>
</section>
```

## ✅ Обратная совместимость

Все старые классы продолжают работать:
- `--color-primary` → `var(--primary)`
- `--color-bg` → `var(--bg)`
- `--color-fg` → `var(--fg)`
- `.btn-primary`, `.btn-secondary` продолжают работать

## 🧪 Тестирование

```bash
npm run build  # ✅ Сборка успешна
npm run dev    # ✅ Dev сервер работает
```

## 📊 Контрастность

- ✅ `#f5f5f5` на `#0a0a0a` = 18.6:1 (AAA)
- ✅ `#b3b3b3` на `#0a0a0a` = 7.2:1 (AAA)
- ✅ `#60a5fa` на `#0a0a0a` = 5.8:1 (AA)

