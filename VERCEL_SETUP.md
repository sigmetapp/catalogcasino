# Инструкция: Подключение Supabase к Vercel

Пошаговая инструкция по настройке переменных окружения для подключения базы данных Supabase к приложению на Vercel.

## Шаг 1: Получение ключей из Supabase

1. **Откройте Supabase Dashboard**
   - Перейдите на [https://app.supabase.com](https://app.supabase.com)
   - Войдите в свой аккаунт

2. **Выберите проект**
   - Выберите проект, который хотите подключить к Vercel

3. **Получите ключи API**
   - В левом меню выберите **⚙️ Settings** (Настройки)
   - Перейдите в раздел **API**
   - Вы найдете следующие значения:

### Настройки API (API Settings)

**Project URL** (URL проекта)
- Это ваш `NEXT_PUBLIC_SUPABASE_URL`
- Пример: `https://xxxxxxxxxxxxx.supabase.co`

**anon public** ключ
- Это ваш `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Начинается с `eyJ...`
- ⚠️ Этот ключ можно использовать в клиентском коде (публичный)

**service_role** ключ
- Это ваш `SUPABASE_SERVICE_ROLE_KEY`
- Начинается с `eyJ...`
- ⚠️ **ВАЖНО**: Этот ключ НЕ должен быть доступен в клиентском коде! Используется только на сервере.

## Шаг 2: Добавление переменных окружения в Vercel

### Вариант A: Через веб-интерфейс Vercel (Рекомендуется)

1. **Откройте Vercel Dashboard**
   - Перейдите на [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Войдите в свой аккаунт

2. **Выберите проект**
   - Найдите и откройте проект `catalogcasino` (или ваш проект)

3. **Перейдите в настройки проекта**
   - Нажмите на название проекта
   - В верхнем меню выберите **Settings** (Настройки)

4. **Откройте раздел Environment Variables**
   - В левом меню выберите **Environment Variables**

5. **Добавьте переменные окружения**

   Нажмите **Add New** и добавьте каждую переменную:

   #### Переменная 1: `NEXT_PUBLIC_SUPABASE_URL`
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Скопируйте **Project URL** из Supabase (например: `https://xxxxxxxxxxxxx.supabase.co`)
   - **Environment**: Выберите все окружения:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Нажмите **Save**

   #### Переменная 2: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Скопируйте **anon public** ключ из Supabase
   - **Environment**: Выберите все окружения:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Нажмите **Save**

   #### Переменная 3: `SUPABASE_SERVICE_ROLE_KEY`
   - **Key**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Скопируйте **service_role** ключ из Supabase
   - **Environment**: Выберите все окружения:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Нажмите **Save**

   #### Переменная 4 (опционально): `SEED_SECRET_TOKEN`
   - **Key**: `SEED_SECRET_TOKEN`
   - **Value**: Придумайте случайный секретный ключ (например, используйте [генератор](https://randomkeygen.com/))
   - **Environment**: Выберите все окружения (опционально)
   - Нажмите **Save**

6. **Перезапустите деплой**
   - После добавления всех переменных, перейдите в раздел **Deployments**
   - Найдите последний деплой
   - Нажмите на три точки (⋮) рядом с деплоем
   - Выберите **Redeploy**
   - Или создайте новый коммит и запушьте в GitHub

### Вариант B: Через Vercel CLI

Если у вас установлен Vercel CLI:

```bash
# Установите Vercel CLI (если еще не установлен)
npm i -g vercel

# Войдите в Vercel
vercel login

# Добавьте переменные окружения
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SEED_SECRET_TOKEN  # опционально

# Перезапустите деплой
vercel --prod
```

## Шаг 3: Проверка подключения

После добавления переменных и перезапуска деплоя:

1. **Проверьте через API endpoint**
   - Откройте в браузере: `https://catalogcasino.vercel.app/api/health`
   - Должен вернуться JSON с информацией о статусе подключения

2. **Проверьте главную страницу**
   - Откройте: `https://catalogcasino.vercel.app/`
   - Если база данных подключена, но нет данных, вы увидите "No casinos found"
   - Если есть проблема с подключением, откройте консоль браузера (F12) для просмотра ошибок

## Шаг 4: Инициализация базы данных

После успешного подключения, нужно создать таблицы и добавить данные:

1. **Откройте Supabase Dashboard**
2. **Перейдите в SQL Editor**
3. **Выполните SQL скрипт**
   - Скопируйте содержимое файла `seed-demo-casinos.sql`
   - Вставьте в SQL Editor
   - Нажмите **Run** (Выполнить)

Или используйте API endpoint:

```bash
curl -X POST https://catalogcasino.vercel.app/api/seed \
  -H "Authorization: Bearer YOUR_SEED_SECRET_TOKEN"
```

## Проверка переменных окружения

После настройки, проверьте, что все переменные добавлены:

1. В Vercel Dashboard → Settings → Environment Variables
2. Должны быть видны 3-4 переменные:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `SEED_SECRET_TOKEN` (опционально)

## Важные моменты

⚠️ **Безопасность**:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - публичный ключ, безопасен для клиента
- `SUPABASE_SERVICE_ROLE_KEY` - **НИКОГДА** не используйте в клиентском коде! Только на сервере.
- `SEED_SECRET_TOKEN` - используйте для защиты API endpoint `/api/seed`

⚠️ **После добавления переменных**:
- Переменные применяются только к новым деплоям
- Старые деплои нужно перезапустить (Redeploy)

⚠️ **Если что-то не работает**:
1. Проверьте, что все переменные добавлены правильно
2. Проверьте, что нет лишних пробелов в значениях
3. Перезапустите деплой после добавления переменных
4. Проверьте логи деплоя в Vercel Dashboard

## Быстрая проверка

После настройки выполните:

```bash
# Проверить статус подключения
curl https://catalogcasino.vercel.app/api/health
```

Ожидаемый ответ (если всё подключено):
```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "tables": {
      "casinos": { "exists": true, "count": 0 }
    }
  },
  "environment": {
    "supabaseUrl": true,
    "supabaseAnonKey": true,
    "supabaseServiceKey": true
  }
}
```
